"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notificationService_1 = require("../services/notificationService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class NotificationController {
}
exports.NotificationController = NotificationController;
_a = NotificationController;
// POST /api/v1/notifications
NotificationController.create = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId || 'system';
    const notification = await notificationService_1.NotificationService.createNotification(dto, userId);
    res.status(201).json({
        success: true, status: 201, message: 'Notification sent', data: notification,
    });
});
// POST /api/v1/notifications/bulk
NotificationController.bulkSend = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId || 'system';
    const result = await notificationService_1.NotificationService.sendBulkNotifications(dto, userId);
    res.status(200).json({
        success: true, status: 200,
        message: `Sent ${result.sent} of ${result.total} notifications`,
        data: result,
    });
});
// GET /api/v1/notifications
NotificationController.list = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const currentUserId = req.user?.userId;
    const result = await notificationService_1.NotificationService.listNotifications(query, currentUserId);
    res.status(200).json({
        success: true, status: 200,
        data: result.notifications,
        pagination: result.pagination,
        unreadCount: result.unreadCount,
    });
});
// PATCH /api/v1/notifications/:id/read
NotificationController.markAsRead = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const notification = await notificationService_1.NotificationService.markAsRead(id, userId);
    res.status(200).json({
        success: true, status: 200, message: 'Marked as read', data: notification,
    });
});
// PATCH /api/v1/notifications/read-all
NotificationController.markAllAsRead = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const result = await notificationService_1.NotificationService.markAllAsRead(userId);
    res.status(200).json({
        success: true, status: 200,
        message: `${result.count} notifications marked as read`, data: result,
    });
});
// DELETE /api/v1/notifications/:id
NotificationController.delete = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    await notificationService_1.NotificationService.deleteNotification(id, userId);
    res.status(200).json({
        success: true, status: 200, message: 'Notification deleted',
    });
});
// GET /api/v1/notifications/stats
NotificationController.stats = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const stats = await notificationService_1.NotificationService.getNotificationStats();
    res.status(200).json({
        success: true, status: 200, data: stats,
    });
});
// POST /api/v1/notifications/send-reminders
NotificationController.sendReminders = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const result = await notificationService_1.NotificationService.sendAppointmentReminders();
    res.status(200).json({
        success: true, status: 200,
        message: `Reminders: ${result.sent} sent, ${result.failed} failed`,
        data: result,
    });
});
//# sourceMappingURL=notificationController.js.map