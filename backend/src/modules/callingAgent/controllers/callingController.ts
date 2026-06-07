import { Request, Response } from 'express';
import { CallingService } from '../services/callingService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import { InitiateCallInput, TransferToHumanInput, CallQueryInput } from '../validators/callingValidator';

export class CallingController {
  static initiateCall = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: InitiateCallInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await CallingService.initiateOutboundCall(dto, userId);
    res.status(200).json({ success: true, status: 200, message: result.message, data: result });
  });

  static transferToHuman = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: TransferToHumanInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();
    const result = await CallingService.transferToHuman(dto, userId);
    res.type('text/xml').send(result.twiml);
  });

  static callLogs = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: CallQueryInput = req.query as any;
    const result = await CallingService.getCallLogs(query);
    res.status(200).json({ success: true, status: 200, data: result.calls, pagination: result.pagination });
  });

  static transcript = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { callSid } = req.params;
    const result = await CallingService.getCallTranscript(callSid);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await CallingService.getCallStats();
    res.status(200).json({ success: true, status: 200, data: stats });
  });

  static activeCalls = AsyncHandler.handle(async (req: Request, res: Response) => {
    const calls = await CallingService.getActiveCalls();
    res.status(200).json({ success: true, status: 200, data: calls });
  });
}