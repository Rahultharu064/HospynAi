"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const memoryController_1 = require("../controllers/memoryController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const client_1 = require("@prisma/client");
const memoryValidators_1 = require("../validators/memoryValidators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Save memory
router.post('/', (0, validateMiddleware_1.validate)({ body: memoryValidators_1.saveMemorySchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE), memoryController_1.MemoryController.save);
// Search memories
router.post('/search', (0, validateMiddleware_1.validate)({ body: memoryValidators_1.searchMemorySchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE), memoryController_1.MemoryController.search);
// List memories
router.get('/', (0, validateMiddleware_1.validate)({ query: memoryValidators_1.memoryQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), memoryController_1.MemoryController.list);
// Stats
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), memoryController_1.MemoryController.stats);
// Patient context
router.get('/patient/:patientId/context', (0, validateMiddleware_1.validate)({ params: memoryValidators_1.patientMemorySchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE), memoryController_1.MemoryController.patientContext);
// Consolidate memories
router.post('/consolidate', (0, validateMiddleware_1.validate)({ body: memoryValidators_1.consolidateMemoriesSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), memoryController_1.MemoryController.consolidate);
// Get by ID
router.get('/:id', (0, validateMiddleware_1.validate)({ params: memoryValidators_1.memoryIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE), memoryController_1.MemoryController.getById);
// Update
router.patch('/:id', (0, validateMiddleware_1.validate)({ params: memoryValidators_1.updateMemorySchema.shape.params, body: memoryValidators_1.updateMemorySchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.DOCTOR), memoryController_1.MemoryController.update);
// Delete
router.delete('/:id', (0, validateMiddleware_1.validate)({ params: memoryValidators_1.memoryIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), memoryController_1.MemoryController.delete);
exports.default = router;
//# sourceMappingURL=memoryRoute.js.map