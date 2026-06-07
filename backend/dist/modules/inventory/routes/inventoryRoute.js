"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventoryController_1 = require("../controllers/inventoryController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const inventoryValidators_1 = require("../validators/inventoryValidators");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
const inventoryLimiter = (0, express_rate_limit_1.rateLimit)({ windowMs: 60 * 1000, max: 50 });
// CRUD
router.post('/', inventoryLimiter, (0, validateMiddleware_1.validate)({ body: inventoryValidators_1.addInventoryItemSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.addItem);
router.get('/', (0, validateMiddleware_1.validate)({ query: inventoryValidators_1.inventoryQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST, client_1.UserRole.DOCTOR, client_1.UserRole.NURSE), inventoryController_1.InventoryController.listItems);
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.stats);
router.get('/expiry-alerts', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.expiryAlerts);
router.get('/reorder-recommendations', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.reorderRecommendations);
router.get('/movements', (0, validateMiddleware_1.validate)({ query: inventoryValidators_1.stockMovementQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.movements);
router.get('/:id', (0, validateMiddleware_1.validate)({ params: inventoryValidators_1.inventoryIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST, client_1.UserRole.DOCTOR), inventoryController_1.InventoryController.getItem);
router.patch('/:id', (0, validateMiddleware_1.validate)({ params: inventoryValidators_1.updateInventoryItemSchema.shape.params, body: inventoryValidators_1.updateInventoryItemSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.updateItem);
// Stock operations
router.post('/stock-in', (0, validateMiddleware_1.validate)({ body: inventoryValidators_1.stockInSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.stockIn);
router.post('/stock-out', (0, validateMiddleware_1.validate)({ body: inventoryValidators_1.stockOutSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.stockOut);
router.post('/dispense', (0, validateMiddleware_1.validate)({ body: inventoryValidators_1.dispenseMedicationSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.PHARMACIST), inventoryController_1.InventoryController.dispense);
exports.default = router;
//# sourceMappingURL=inventoryRoute.js.map