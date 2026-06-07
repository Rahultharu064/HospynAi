"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const aiagentService_1 = require("../services/aiagentService");
const ragService_1 = require("../services/ragService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class AiController {
}
exports.AiController = AiController;
_a = AiController;
// ============================================
// AGENT ENDPOINTS
// ============================================
AiController.agentChat = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await aiagentService_1.AgentService.chat(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
});
AiController.agentTask = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await aiagentService_1.AgentService.executeTask(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
});
AiController.executeTool = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await aiagentService_1.AgentService.executeToolCall(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
});
AiController.agentHistory = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await aiagentService_1.AgentService.getAgentHistory(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
// ============================================
// RAG ENDPOINTS
// ============================================
AiController.uploadDocument = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new errors_1.BadRequestError('Document file is required');
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await ragService_1.RagService.ingestDocument(file, dto, userId);
    res.status(201).json({ success: true, status: 201, message: 'Document ingested', data: result });
});
AiController.ragQuery = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await ragService_1.RagService.query(dto);
    res.status(200).json({ success: true, status: 200, data: result });
});
AiController.listDocuments = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await ragService_1.RagService.listDocuments(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
AiController.deleteDocument = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await ragService_1.RagService.deleteDocument(id, userId);
    res.status(200).json({ success: true, status: 200, message: 'Document deleted' });
});
//# sourceMappingURL=aiagentController.js.map