"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotController = void 0;
const chatbot_service_1 = require("../services/chatbot.service");
const error_middleware_1 = require("../middleware/error.middleware");
const errors_1 = require("../utils/errors");
class ChatbotController {
}
exports.ChatbotController = ChatbotController;
_a = ChatbotController;
// POST /api/v1/chatbot/message
ChatbotController.sendMessage = error_middleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await chatbot_service_1.ChatbotService.processTextMessage(dto, userId, req.ip || '');
    res.status(200).json({ success: true, status: 200, data: result });
});
// POST /api/v1/chatbot/stream
ChatbotController.streamMessage = error_middleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    await chatbot_service_1.ChatbotService.streamTextMessage(dto, userId, {
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
ChatbotController.sendAudio = error_middleware_1.AsyncHandler.handle(async (req, res) => {
    const file = req.file;
    if (!file)
        throw new errors_1.BadRequestError('Audio file is required');
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await chatbot_service_1.ChatbotService.processAudioMessage(file, dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
});
// GET /api/v1/chatbot/history
ChatbotController.getHistory = error_middleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await chatbot_service_1.ChatbotService.getChatHistory(query);
    res.status(200).json({ success: true, status: 200, data: result });
});
// DELETE /api/v1/chatbot/history
ChatbotController.clearHistory = error_middleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    await chatbot_service_1.ChatbotService.clearHistory(dto.sessionId, dto.patientId);
    res.status(200).json({ success: true, status: 200, message: 'History cleared' });
});
// GET /api/v1/chatbot/stats
ChatbotController.getStats = error_middleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await chatbot_service_1.ChatbotService.getChatStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
//# sourceMappingURL=chatbotController.js.map