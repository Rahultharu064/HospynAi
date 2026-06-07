import { Server } from 'socket.io';
export declare function setupNotificationSocket(io: Server): void;
/**
 * Send real-time notification to a specific user
 */
export declare function sendRealTimeNotification(userId: string, notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
}): Promise<void>;
/**
 * Send broadcast notification to all users with a specific role
 */
export declare function sendBroadcastNotification(role: string, notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
}): Promise<void>;
/**
 * Check if user is connected
 */
export declare function isUserConnected(userId: string): boolean;
/**
 * Get connected users count
 */
export declare function getConnectedUsersCount(): number;
//# sourceMappingURL=notificationSocket.d.ts.map