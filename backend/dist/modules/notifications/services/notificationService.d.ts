import { CreateNotificationInput, BulkNotificationInput, NotificationQueryInput } from '../validators/notificationValidator';
import { NotificationResponse, NotificationListResponse, NotificationStats } from '../../../types/notificationTypes';
export declare class NotificationService {
    /**
     * Create and send notification
     */
    static createNotification(data: CreateNotificationInput, userId: string): Promise<NotificationResponse>;
    /**
     * Send via specific channel
     */
    private static sendViaChannel;
    /**
     * Send appointment reminders
     */
    static sendAppointmentReminders(): Promise<{
        sent: number;
        failed: number;
    }>;
    /**
     * Send bulk notifications to multiple users
     */
    static sendBulkNotifications(dto: BulkNotificationInput, performedBy: string): Promise<{
        total: number;
        sent: number;
        failed: number;
    }>;
    /**
     * List notifications
     */
    static listNotifications(query: NotificationQueryInput, currentUserId?: string): Promise<NotificationListResponse>;
    /**
     * Mark as read
     */
    static markAsRead(notificationId: string, userId: string): Promise<NotificationResponse>;
    /**
     * Mark all notifications as read for a user
     */
    static markAllAsRead(userId: string): Promise<{
        count: number;
    }>;
    /**
     * Delete notification
     */
    static deleteNotification(notificationId: string, userId: string): Promise<void>;
    /**
     * Notification statistics
     */
    static getNotificationStats(): Promise<NotificationStats>;
    private static formatNotificationResponse;
}
//# sourceMappingURL=notificationService.d.ts.map