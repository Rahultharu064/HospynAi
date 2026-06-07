"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryController = void 0;
const memoryService_1 = require("../services/memoryService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
class MemoryController {
}
exports.MemoryController = MemoryController;
_a = MemoryController;
// POST /api/v1/memory
MemoryController.save = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId || 'system';
    const memory = await memoryService_1.MemoryService.saveMemory(dto, userId);
    res.status(201).json({ success: true, status: 201, message: 'Memory saved', data: memory });
});
// POST /api/v1/memory/search
MemoryController.search = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const results = await memoryService_1.MemoryService.searchMemories(dto);
    res.status(200).json({ success: true, status: 200, data: results });
});
// GET /api/v1/memory/:id
MemoryController.getById = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const memory = await memoryService_1.MemoryService.getMemoryById(id);
    res.status(200).json({ success: true, status: 200, data: memory });
});
// PATCH /api/v1/memory/:id
MemoryController.update = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId || 'system';
    const memory = await memoryService_1.MemoryService.updateMemory(id, dto, userId);
    res.status(200).json({ success: true, status: 200, message: 'Memory updated', data: memory });
});
// DELETE /api/v1/memory/:id
MemoryController.delete = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId || 'system';
    await memoryService_1.MemoryService.deleteMemory(id, userId);
    res.status(200).json({ success: true, status: 200, message: 'Memory deleted' });
});
// GET /api/v1/memory
MemoryController.list = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await memoryService_1.MemoryService.listMemories(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
// GET /api/v1/memory/patient/:patientId/context
MemoryController.patientContext = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { patientId } = req.params;
    const context = await memoryService_1.MemoryService.getPatientContext(patientId);
    res.status(200).json({ success: true, status: 200, data: context });
});
// POST /api/v1/memory/consolidate
MemoryController.consolidate = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId || 'system';
    const result = await memoryService_1.MemoryService.consolidateMemories(dto, userId);
    res.status(200).json({ success: true, status: 200, data: result });
});
// GET /api/v1/memory/stats
MemoryController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await memoryService_1.MemoryService.getMemoryStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
//# sourceMappingURL=memoryController.js.map