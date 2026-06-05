import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { config } from '../../config';
import { TokenPayload } from '../../types/authTypes';
import { ChatbotService } from '../../modules/chatbot/services/chatbotService';
import logger from '../../utils/logger';

const activeSessions = new Map<string, Set<string>>();

export function setupChatbotSocket(io: Server): void {
  const chatbotNamespace = io.of('/chatbot');

  // Authentication
  chatbotNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = verify(token as string, config.jwt.accessTokenSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  chatbotNamespace.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    logger.info(`Chatbot WebSocket connected: ${user.userId}`);

    // Track session
    if (!activeSessions.has(user.userId)) {
      activeSessions.set(user.userId, new Set());
    }
    activeSessions.get(user.userId)!.add(socket.id);

    /**
     * Send text message
     */
    socket.on('send-message', async (data: {
      message: string;
      sessionId?: string;
      patientId?: string;
      context?: string;
    }) => {
      try {
        // Send typing indicator
        socket.emit('typing', { status: true });

        const result = await ChatbotService.processTextMessage(
          {
            message: data.message,
            sessionId: data.sessionId,
            patientId: data.patientId,
            context: data.context as any,
          },
          user.userId,
          socket.handshake.address
        );

        socket.emit('typing', { status: false });
        socket.emit('message-received', result);
      } catch (error: any) {
        socket.emit('typing', { status: false });
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Stream message (token by token)
     */
    socket.on('stream-message', async (data: {
      message: string;
      sessionId?: string;
      patientId?: string;
      context?: string;
    }) => {
      try {
        socket.emit('stream-start', { sessionId: data.sessionId });

        await ChatbotService.streamTextMessage(
          {
            message: data.message,
            sessionId: data.sessionId,
            patientId: data.patientId,
            context: data.context as any,
            stream: true,
          },
          user.userId,
          {
            onToken: (token) => {
              socket.emit('stream-token', { token });
            },
            onComplete: (response) => {
              socket.emit('stream-complete', response);
            },
            onError: (error) => {
              socket.emit('stream-error', { message: error.message });
            },
          }
        );
      } catch (error: any) {
        socket.emit('stream-error', { message: error.message });
      }
    });

    /**
     * Send audio message
     */
    socket.on('send-audio', async (data: {
      audio: string; // base64
      format?: string;
      sessionId?: string;
      patientId?: string;
      context?: string;
    }) => {
      try {
        socket.emit('processing-audio', { status: true });

        const audioBuffer = Buffer.from(data.audio, 'base64');
        const result = await ChatbotService.processAudioMessage(
          audioBuffer,
          {
            format: data.format as any,
            sessionId: data.sessionId,
            patientId: data.patientId,
            context: data.context as any,
          },
          user.userId
        );

        socket.emit('processing-audio', { status: false });
        socket.emit('audio-response', result);
      } catch (error: any) {
        socket.emit('processing-audio', { status: false });
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Get chat history
     */
    socket.on('get-history', async (data: { sessionId?: string; patientId?: string }) => {
      try {
        const history = await ChatbotService.getChatHistory({
          sessionId: data.sessionId,
          patientId: data.patientId,
        });

        socket.emit('chat-history', history);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Clear chat history
     */
    socket.on('clear-history', async (data: { sessionId?: string; patientId?: string }) => {
      try {
        await ChatbotService.clearHistory(data.sessionId, data.patientId);
        socket.emit('history-cleared', { success: true });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing', (data: { status: boolean }) => {
      socket.broadcast.emit('user-typing', {
        userId: user.userId,
        status: data.status,
      });
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      const userSockets = activeSessions.get(user.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          activeSessions.delete(user.userId);
        }
      }
      logger.info(`Chatbot WebSocket disconnected: ${user.userId}`);
    });
  });
}

export function getActiveChatUsers(): number {
  return activeSessions.size;
}