"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiagentController_1 = require("../controllers/aiagentController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const uploadMiddleware_1 = require("../../../middleware/uploadMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const aiagentValidators_1 = require("../validators/aiagentValidators");
const router = (0, express_1.Router)();
const aiLimiter = (0, express_rate_limit_1.rateLimit)({ windowMs: 60 * 1000, max: 30 });
router.use(authMiddleware_1.authenticate);
// Agent chat
router.post('/chat', aiLimiter, (0, validateMiddleware_1.validate)({ body: aiagentValidators_1.agentChatSchema.shape.body }), aiagentController_1.AiController.agentChat);
// Agent task
router.post('/task', (0, validateMiddleware_1.validate)({ body: aiagentValidators_1.agentTaskSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), aiagentController_1.AiController.agentTask);
// Execute tool
router.post('/tool', (0, validateMiddleware_1.validate)({ body: aiagentValidators_1.toolExecutionSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), aiagentController_1.AiController.executeTool);
// Agent history
router.get('/history', (0, validateMiddleware_1.validate)({ query: aiagentValidators_1.agentQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), aiagentController_1.AiController.agentHistory);
// RAG - Upload document
router.post('/rag/upload', uploadMiddleware_1.upload.single('document'), (0, validateMiddleware_1.validate)({ body: aiagentValidators_1.ingestDocumentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), aiagentController_1.AiController.uploadDocument);
// RAG - Query
router.post('/rag/query', (0, validateMiddleware_1.validate)({ body: aiagentValidators_1.ragQuerySchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), aiagentController_1.AiController.ragQuery);
// RAG - List documents
router.get('/rag/documents', (0, validateMiddleware_1.validate)({ query: aiagentValidators_1.ragDocumentQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), aiagentController_1.AiController.listDocuments);
// RAG - Delete document
router.delete('/rag/documents/:id', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), aiagentController_1.AiController.deleteDocument);
exports.default = router;
//# sourceMappingURL=aiagentRoute.js.map