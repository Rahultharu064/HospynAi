"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemedicineController = void 0;
const telemedicineService_1 = require("../services/telemedicineService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class TelemedicineController {
}
exports.TelemedicineController = TelemedicineController;
_a = TelemedicineController;
// POST /api/v1/telemedicine/sessions
TelemedicineController.createSession = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await telemedicineService_1.TelemedicineService.createSession(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true, status: 201, message: 'Session created', data: result,
    });
});
// PATCH /api/v1/telemedicine/sessions/:sessionId/end
TelemedicineController.endSession = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { sessionId } = req.params;
    const { reason, notes } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await telemedicineService_1.TelemedicineService.endSession(sessionId, reason, notes, userId);
    res.status(200).json({
        success: true, status: 200, message: 'Session ended', data: result,
    });
});
// GET /api/v1/telemedicine/sessions
TelemedicineController.listSessions = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await telemedicineService_1.TelemedicineService.listSessions(query);
    res.status(200).json({ success: true, status: 200, ...result });
});
// GET /api/v1/telemedicine/stats
TelemedicineController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await telemedicineService_1.TelemedicineService.getSessionStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
//# sourceMappingURL=telemedicineController.js.map