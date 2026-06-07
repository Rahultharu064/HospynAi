"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallingController = void 0;
const callingService_1 = require("../services/callingService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class CallingController {
}
exports.CallingController = CallingController;
_a = CallingController;
CallingController.initiateCall = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await callingService_1.CallingService.initiateOutboundCall(dto, userId);
    res.status(200).json({ success: true, status: 200, message: result.message, data: result });
});
CallingController.transferToHuman = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await callingService_1.CallingService.transferToHuman(dto, userId);
    res.type('text/xml').send(result.twiml);
});
CallingController.callLogs = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await callingService_1.CallingService.getCallLogs(query);
    res.status(200).json({ success: true, status: 200, data: result.calls, pagination: result.pagination });
});
CallingController.transcript = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { callSid } = req.params;
    const result = await callingService_1.CallingService.getCallTranscript(callSid);
    res.status(200).json({ success: true, status: 200, data: result });
});
CallingController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await callingService_1.CallingService.getCallStats();
    res.status(200).json({ success: true, status: 200, data: stats });
});
CallingController.activeCalls = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const calls = await callingService_1.CallingService.getActiveCalls();
    res.status(200).json({ success: true, status: 200, data: calls });
});
//# sourceMappingURL=callingController.js.map