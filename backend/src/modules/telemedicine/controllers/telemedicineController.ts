import { Request, Response } from 'express';
import { TelemedicineService } from '../services/telemedicineService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreateSessionInput, SessionQueryInput,
} from '../validators/telemedicineValidators';

export class TelemedicineController {
  // POST /api/v1/telemedicine/sessions
  static createSession = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateSessionInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await TelemedicineService.createSession(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true, status: 201, message: 'Session created', data: result,
    });
  });

  // PATCH /api/v1/telemedicine/sessions/:sessionId/end
  static endSession = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { reason, notes } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await TelemedicineService.endSession(sessionId, reason, notes, userId);

    res.status(200).json({
      success: true, status: 200, message: 'Session ended', data: result,
    });
  });

  // GET /api/v1/telemedicine/sessions
  static listSessions = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: SessionQueryInput = req.query as any;
    const result = await TelemedicineService.listSessions(query);

    res.status(200).json({ success: true, status: 200, ...result });
  });

  // GET /api/v1/telemedicine/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await TelemedicineService.getSessionStats();

    res.status(200).json({ success: true, status: 200, data: stats });
  });
}