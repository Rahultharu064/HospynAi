"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatbotController_1 = require("../controllers/chatbotController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const uploadMiddleware_1 = require("../../../middleware/uploadMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const chatbotValidator_1 = require("../validators/chatbotValidator");
const router = (0, express_1.Router)();
const chatbotLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many chatbot requests' },
});
// Text message
router.post('/message', chatbotLimiter, authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ body: chatbotValidator_1.chatMessageSchema.shape.body }), chatbotController_1.ChatbotController.sendMessage);
// Stream message (SSE)
router.post('/stream', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ body: chatbotValidator_1.chatMessageSchema.shape.body }), chatbotController_1.ChatbotController.streamMessage);
// Audio message
router.post('/audio', chatbotLimiter, authMiddleware_1.authenticate, uploadMiddleware_1.upload.single('audio'), (0, validateMiddleware_1.validate)({ body: chatbotValidator_1.audioMessageSchema.shape.body }), chatbotController_1.ChatbotController.sendAudio);
// Chat history
router.get('/history', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ query: chatbotValidator_1.chatHistorySchema.shape.query }), chatbotController_1.ChatbotController.getHistory);
// Clear history
router.delete('/history', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ body: chatbotValidator_1.clearHistorySchema.shape.body }), chatbotController_1.ChatbotController.clearHistory);
// Stats
router.get('/stats', authMiddleware_1.authenticate, chatbotController_1.ChatbotController.getStats);
exports.default = router;
//# sourceMappingURL=chatbotRoute.js.map