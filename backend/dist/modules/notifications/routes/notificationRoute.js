"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const notificationValidator_1 = require("../validators/notificationValidator");
const router = (0, express_1.Router)();
const notificationLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many notification requests' },
});
router.use(authMiddleware_1.authenticate);
// Create notification
router.post('/', notificationLimiter, (0, validateMiddleware_1.validate)({ body: notificationValidator_1.createNotificationSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), notificationController_1.NotificationController.create);
// Bulk send
router.post('/bulk', (0, validateMiddleware_1.validate)({ body: notificationValidator_1.bulkNotificationSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), notificationController_1.NotificationController.bulkSend);
// List notifications
router.get('/', (0, validateMiddleware_1.validate)({ query: notificationValidator_1.notificationQuerySchema.shape.query }), notificationController_1.NotificationController.list);
// Get stats
router.get('/stats', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), notificationController_1.NotificationController.stats);
// Send reminders (Admin/System)
router.post('/send-reminders', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), notificationController_1.NotificationController.sendReminders);
// Mark all as read
router.patch('/read-all', notificationController_1.NotificationController.markAllAsRead);
// Mark single as read
router.patch('/:id/read', (0, validateMiddleware_1.validate)({ params: notificationValidator_1.notificationIdSchema.shape.params }), notificationController_1.NotificationController.markAsRead);
// Delete notification
router.delete('/:id', (0, validateMiddleware_1.validate)({ params: notificationValidator_1.notificationIdSchema.shape.params }), notificationController_1.NotificationController.delete);
exports.default = router;
//# sourceMappingURL=notificationRoute.js.map