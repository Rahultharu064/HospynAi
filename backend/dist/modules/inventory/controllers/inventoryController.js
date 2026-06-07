"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const inventoryService_1 = require("../services/inventoryService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class InventoryController {
}
exports.InventoryController = InventoryController;
_a = InventoryController;
// POST /api/v1/inventory
InventoryController.addItem = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const item = await inventoryService_1.InventoryService.addItem(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: 'Item added', data: item });
});
// GET /api/v1/inventory
InventoryController.listItems = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await inventoryService_1.InventoryService.listItems(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
// GET /api/v1/inventory/:id
InventoryController.getItem = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const item = await inventoryService_1.InventoryService.getItemById(id);
    res.status(200).json({ success: true, status: 200, data: item });
});
// PATCH /api/v1/inventory/:id
InventoryController.updateItem = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const item = await inventoryService_1.InventoryService.updateItem(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Item updated', data: item });
});
// POST /api/v1/inventory/stock-in
InventoryController.stockIn = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const item = await inventoryService_1.InventoryService.stockIn(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Stock added', data: item });
});
// POST /api/v1/inventory/stock-out
InventoryController.stockOut = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const item = await inventoryService_1.InventoryService.stockOut(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Stock removed', data: item });
});
// POST /api/v1/inventory/dispense
InventoryController.dispense = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await inventoryService_1.InventoryService.dispenseMedication(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Medication dispensed', data: result });
});
// GET /api/v1/inventory/stats
InventoryController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const organizationId = req.query.organizationId;
    const stats = await inventoryService_1.InventoryService.getStats(organizationId);
    res.status(200).json({ success: true, status: 200, data: stats });
});
// GET /api/v1/inventory/expiry-alerts
InventoryController.expiryAlerts = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const alerts = await inventoryService_1.InventoryService.getExpiryAlerts();
    res.status(200).json({ success: true, status: 200, data: alerts });
});
// GET /api/v1/inventory/reorder-recommendations
InventoryController.reorderRecommendations = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const recommendations = await inventoryService_1.InventoryService.getReorderRecommendations();
    res.status(200).json({ success: true, status: 200, data: recommendations });
});
// GET /api/v1/inventory/movements
InventoryController.movements = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await inventoryService_1.InventoryService.getStockMovements(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
//# sourceMappingURL=inventoryController.js.map