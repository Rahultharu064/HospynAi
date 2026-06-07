import { CreateNotificationInput, NotificationQueryInput } from '../validators/notificationValidator';
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
     * List notifications
     */
    static listNotifications(query: NotificationQueryInput, currentUserId?: string): Promise<NotificationListResponse>;
    /**
     * Mark as read
     */
    static markAsRead(notificationId: string, userId: string): Promise<NotificationResponse>;
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