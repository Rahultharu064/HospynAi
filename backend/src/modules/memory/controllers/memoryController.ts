import { Request, Response } from 'express';
import { MemoryService } from '../services/memoryService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  SaveMemoryInput, UpdateMemoryInput, SearchMemoryInput,
  MemoryQueryInput, ConsolidateMemoriesInput,
} from '../validators/memoryValidators';

export class MemoryController {
  // POST /api/v1/memory
  static save = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: SaveMemoryInput = req.body;
    const userId = req.user?.userId || 'system';

    const memory = await MemoryService.saveMemory(dto, userId);
    res.status(201).json({ success: true, status: 201, message: 'Memory saved', data: memory });
  });

  // POST /api/v1/memory/search
  static search = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: SearchMemoryInput = req.body;
    const results = await MemoryService.searchMemories(dto);
    res.status(200).json({ success: true, status: 200, data: results });
  });

  // GET /api/v1/memory/:id
  static getById = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const memory = await MemoryService.getMemoryById(id);
    res.status(200).json({ success: true, status: 200, data: memory });
  });

  // PATCH /api/v1/memory/:id
  static update = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateMemoryInput = req.body;
    const userId = req.user?.userId || 'system';

    const memory = await MemoryService.updateMemory(id, dto, userId);
    res.status(200).json({ success: true, status: 200, message: 'Memory updated', data: memory });
  });

  // DELETE /api/v1/memory/:id
  static delete = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId || 'system';

    await MemoryService.deleteMemory(id, userId);
    res.status(200).json({ success: true, status: 200, message: 'Memory deleted' });
  });

  // GET /api/v1/memory
  static list = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: MemoryQueryInput = req.query as any;
    const result = await MemoryService.listMemories(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  // GET /api/v1/memory/patient/:patientId/context
  static patientContext = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const context = await MemoryService.getPatientContext(patientId);
    res.status(200).json({ success: true, status: 200, data: context });
  });

  // POST /api/v1/memory/consolidate
  static consolidate = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ConsolidateMemoriesInput = req.body;
    const userId = req.user?.userId || 'system';

    const result = await MemoryService.consolidateMemories(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  // GET /api/v1/memory/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await MemoryService.getMemoryStats();
    res.status(200).json({ success: true, status: 200, data: stats });
  });
}