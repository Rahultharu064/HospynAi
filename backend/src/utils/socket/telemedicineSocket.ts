import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { config } from '../../config';
import { TokenPayload } from '../../types/authTypes';
import logger from '../../utils/logger';

interface RoomParticipant {
  userId: string;
  socketId: string;
  role: 'DOCTOR' | 'PATIENT';
  joinedAt: Date;
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
}

const rooms = new Map<string, Map<string, RoomParticipant>>();

export function setupTelemedicineSocket(io: Server): void {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verify(token as string, config.jwt.accessTokenSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    logger.info(`User connected to telemedicine: ${user.userId} (${socket.id})`);

    // ============================================
    // JOIN ROOM
    // ============================================
    socket.on('join-room', async (data: { roomId: string; role: 'DOCTOR' | 'PATIENT' }) => {
      const { roomId, role } = data;

      // Join the socket room
      socket.join(roomId);

      // Track participant
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      
      rooms.get(roomId)!.set(user.userId, {
        userId: user.userId,
        socketId: socket.id,
        role,
        joinedAt: new Date(),
        status: 'CONNECTING',
      });

      // Notify other participants
      socket.to(roomId).emit('participant-joined', {
        userId: user.userId,
        role,
        timestamp: new Date().toISOString(),
      });

      // Send current participants list
      const participants = Array.from(rooms.get(roomId)!.values()).map((p) => ({
        userId: p.userId,
        role: p.role,
        status: p.status,
      }));

      socket.emit('room-joined', {
        roomId,
        participants,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${user.userId} joined room ${roomId} as ${role}`);
    });

    // ============================================
    // WEBRTC SIGNALING
    // ============================================

    socket.on('signal', (data: { roomId: string; signal: any; type: string; targetUserId?: string }) => {
      const { roomId, signal, type, targetUserId } = data;

      if (targetUserId) {
        // Send to specific user
        const participant = rooms.get(roomId)?.get(targetUserId);
        if (participant) {
          io.to(participant.socketId).emit('signal', {
            signal,
            type,
            fromUserId: user.userId,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Broadcast to all others in room
        socket.to(roomId).emit('signal', {
          signal,
          type,
          fromUserId: user.userId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ============================================
    // CHAT MESSAGES
    // ============================================

    socket.on('chat-message', (data: { roomId: string; message: string; type?: string; fileUrl?: string }) => {
      const { roomId, message, type = 'text', fileUrl } = data;

      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderId: user.userId,
        senderRole: user.role,
        message,
        type,
        fileUrl: fileUrl || null,
        timestamp: new Date().toISOString(),
      };

      // Broadcast to entire room including sender
      io.to(roomId).emit('chat-message', chatMessage);
    });

    // ============================================
    // SCREEN SHARING
    // ============================================

    socket.on('start-screen-share', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('screen-share-started', {
        userId: user.userId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('stop-screen-share', (data: { roomId: string }) => {
      socket.to(data.roomId).emit('screen-share-stopped', {
        userId: user.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // ============================================
    // QUALITY METRICS
    // ============================================

    socket.on('quality-metrics', (data: { roomId: string; metrics: any }) => {
      logger.debug(`Quality metrics from ${user.userId}:`, data.metrics);
      
      // Store metrics for session analysis
      socket.to(data.roomId).emit('participant-quality', {
        userId: user.userId,
        metrics: data.metrics,
        timestamp: new Date().toISOString(),
      });
    });

    // ============================================
    // PARTICIPANT STATUS
    // ============================================

    socket.on('participant-status', (data: { roomId: string; status: string }) => {
      const participant = rooms.get(data.roomId)?.get(user.userId);
      if (participant) {
        participant.status = data.status as any;
        
        socket.to(data.roomId).emit('participant-status-changed', {
          userId: user.userId,
          status: data.status,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // ============================================
    // LEAVE ROOM
    // ============================================

    socket.on('leave-room', (data: { roomId: string; reason?: string }) => {
      handleLeaveRoom(socket, data.roomId, user.userId, data.reason);
    });

    // ============================================
    // DISCONNECT
    // ============================================

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${user.userId} (${socket.id})`);
      
      // Remove from all rooms
      rooms.forEach((participants, roomId) => {
        if (participants.has(user.userId)) {
          handleLeaveRoom(socket, roomId, user.userId, 'Disconnected');
        }
      });
    });
  });
}

function handleLeaveRoom(socket: Socket, roomId: string, userId: string, reason?: string): void {
  socket.leave(roomId);
  
  const participants = rooms.get(roomId);
  if (participants) {
    participants.delete(userId);
    if (participants.size === 0) {
      rooms.delete(roomId);
    }
  }

  socket.to(roomId).emit('participant-left', {
    userId,
    reason: reason || 'Left room',
    timestamp: new Date().toISOString(),
  });

  logger.info(`User ${userId} left room ${roomId}: ${reason || 'No reason'}`);
}

/**
 * Get active rooms info
 */
export function getActiveRooms(): Map<string, Map<string, RoomParticipant>> {
  return rooms;
}

/**
 * Get room participants
 */
export function getRoomParticipants(roomId: string): Map<string, RoomParticipant> | undefined {
  return rooms.get(roomId);
}