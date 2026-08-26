import { Request, Response } from 'express';
import { ChatbotService } from '../services/chatbotService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { ChatMessageInput, AudioMessageInput, ChatHistoryInput, ClearHistoryInput } from '../validators/chatbotValidator';

export class ChatbotController {
  // POST /api/v1/chatbot/message
  static sendMessage = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ChatMessageInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await ChatbotService.processTextMessage(dto, userId, req.ip || '');
    res.status(200).json({ success: true, status: 200, data: result });
  });

  // POST /api/v1/chatbot/stream
  static streamMessage = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ChatMessageInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await ChatbotService.streamTextMessage(dto, userId, {
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      },
      onComplete: (response) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', response })}\n\n`);
        res.end();
      },
      onError: (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
        res.end();
      },
    });
  });

  // POST /api/v1/chatbot/audio
  static sendAudio = AsyncHandler.handle(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new BadRequestError('Audio file is required');

    const dto: AudioMessageInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await ChatbotService.processAudioMessage(file, dto, userId, req.ip || '');
    res.status(200).json({ success: true, status: 200, data: result });
  });

  // GET /api/v1/chatbot/history
  static getHistory = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: ChatHistoryInput = req.query as any;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await ChatbotService.getChatHistory(query, userId);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  // DELETE /api/v1/chatbot/history
  static clearHistory = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ClearHistoryInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await ChatbotService.clearHistory(userId, dto.sessionId, dto.patientId);
    res.status(200).json({ success: true, status: 200, message: 'History cleared' });
  });

  // GET /api/v1/chatbot/stats
  static getStats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await ChatbotService.getChatStats();
    res.status(200).json({ success: true, status: 200, data: stats });
  });
}