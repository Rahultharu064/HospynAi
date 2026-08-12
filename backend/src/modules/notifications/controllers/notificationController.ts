import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreateNotificationInput,
  BulkNotificationInput,
  NotificationQueryInput,
} from '../validators/notificationValidator';

export class NotificationController {
  // POST /api/v1/notifications
  static create = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateNotificationInput = req.body;
    const userId = req.user?.userId || 'system';

    const notification = await NotificationService.createNotification(dto, userId);

    res.status(201).json({
      success: true, status: 201, message: 'Notification sent', data: notification,
    });
  });

  // POST /api/v1/notifications/bulk
  static bulkSend = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: BulkNotificationInput = req.body;
    const userId = req.user?.userId || 'system';

    const result = await NotificationService.sendBulkNotifications(dto, userId);

    res.status(200).json({
      success: true, status: 200,
      message: `Sent ${result.sent} of ${result.total} notifications`,
      data: result,
    });
  });

  // GET /api/v1/notifications
  static list = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: NotificationQueryInput = req.query as any;
    const currentUserId = req.user?.userId;

    const result = await NotificationService.listNotifications(query, currentUserId);

    res.status(200).json({
      success: true, status: 200,
      data: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    });
  });

  // PATCH /api/v1/notifications/:id/read
  static markAsRead = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const notification = await NotificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true, status: 200, message: 'Marked as read', data: notification,
    });
  });

  // PATCH /api/v1/notifications/read-all
  static markAllAsRead = AsyncHandler.handle(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const result = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true, status: 200,
      message: `${result.count} notifications marked as read`, data: result,
    });
  });

  // DELETE /api/v1/notifications/:id
  static delete = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    await NotificationService.deleteNotification(id, userId);

    res.status(200).json({
      success: true, status: 200, message: 'Notification deleted',
    });
  });

  // GET /api/v1/notifications/stats
  static stats = AsyncHandler.handle(async (req: Request, res: Response) => {
    const stats = await NotificationService.getNotificationStats();

    res.status(200).json({
      success: true, status: 200, data: stats,
    });
  });

  // POST /api/v1/notifications/send-reminders
  static sendReminders = AsyncHandler.handle(async (req: Request, res: Response) => {
    const result = await NotificationService.sendAppointmentReminders();

    res.status(200).json({
      success: true, status: 200,
      message: `Reminders: ${result.sent} sent, ${result.failed} failed`,
      data: result,
    });
  });
}