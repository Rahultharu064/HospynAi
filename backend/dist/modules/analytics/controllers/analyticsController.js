"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analyticsService_1 = require("../services/analyticsService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
class AnalyticsController {
}
exports.AnalyticsController = AnalyticsController;
_a = AnalyticsController;
// GET /api/v1/analytics/dashboard
AnalyticsController.dashboard = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const filters = req.query;
    const stats = await analyticsService_1.AnalyticsService.getDashboardStats(filters);
    res.status(200).json({
        success: true, status: 200, data: stats,
    });
});
// GET /api/v1/analytics/export
AnalyticsController.export = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const options = req.body;
    res.status(200).json({
        success: true, status: 200,
        message: `Export initiated in ${options.format} format`,
    });
});
//# sourceMappingURL=analyticsController.js.map