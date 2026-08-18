import { Request, Response } from 'express';
import { AgentService } from '../services/aiagentService';
import { RagService } from '../services/ragService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  AgentChatInput, AgentTaskInput, ToolExecutionInput, AgentQueryInput,
  IngestDocumentInput, RagQueryInput, RagDocumentQueryInput,
  SaveMemoryInput, MemoryQueryInput,
} from '../validators/aiagentValidators';

export class AiController {
  // ============================================
  // AGENT ENDPOINTS
  // ============================================

  static agentChat = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: AgentChatInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await AgentService.chat(dto, userId, req.user?.role);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  static agentTask = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: AgentTaskInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await AgentService.executeTask(dto, userId, req.user?.role);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  static executeTool = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ToolExecutionInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await AgentService.executeToolCall(dto, userId, req.user?.role);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  static agentHistory = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: AgentQueryInput = req.query as any;
    const result = await AgentService.getAgentHistory(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  // ============================================
  // RAG ENDPOINTS
  // ============================================

  static uploadDocument = AsyncHandler.handle(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new BadRequestError('Document file is required');
    const dto: IngestDocumentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await RagService.ingestDocument(file, dto, userId);
    res.status(201).json({ success: true, status: 201, message: 'Document ingested', data: result });
  });

  static ragQuery = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: RagQueryInput = req.body;
    const result = await RagService.query(dto);
    res.status(200).json({ success: true, status: 200, data: result });
  });

  static listDocuments = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: RagDocumentQueryInput = req.query as any;
    const result = await RagService.listDocuments(query);
    res.status(200).json({ success: true, status: 200, ...result });
  });

  static deleteDocument = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await RagService.deleteDocument(id, userId);
    res.status(200).json({ success: true, status: 200, message: 'Document deleted' });
  });
}