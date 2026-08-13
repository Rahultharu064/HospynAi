import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  createNotificationSchema,
  bulkNotificationSchema,
  notificationIdSchema,
  notificationQuerySchema,
} from '../validators/notificationValidator';

const router = Router();

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many notification requests' },
});

router.use(authenticate);

// Create notification
router.post(
  '/',
  notificationLimiter,
  validate({ body: createNotificationSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  NotificationController.create
);

// Bulk send
router.post(
  '/bulk',
  validate({ body: bulkNotificationSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  NotificationController.bulkSend
);

// List notifications
router.get(
  '/',
  validate({ query: notificationQuerySchema.shape.query }),
  NotificationController.list
);

// Get stats
router.get(
  '/stats',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  NotificationController.stats
);

// Send reminders (Admin/System)
router.post(
  '/send-reminders',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  NotificationController.sendReminders
);

// Mark all as read
router.patch(
  '/read-all',
  NotificationController.markAllAsRead
);

// Mark single as read
router.patch(
  '/:id/read',
  validate({ params: notificationIdSchema.shape.params }),
  NotificationController.markAsRead
);

// Delete notification
router.delete(
  '/:id',
  validate({ params: notificationIdSchema.shape.params }),
  NotificationController.delete
);

export default router;