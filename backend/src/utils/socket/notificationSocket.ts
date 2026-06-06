import { Server, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { config } from '../../config';
import { TokenPayload } from '../../types/authTypes';
import logger from '../../utils/logger';

// Track connected users and their socket IDs
const connectedUsers = new Map<string, Set<string>>();

export function setupNotificationSocket(io: Server): void {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verify(token as string, config.jwt.accessTokenSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    logger.info(`User connected for notifications: ${user.userId}`);

    // Track user connection
    if (!connectedUsers.has(user.userId)) {
      connectedUsers.set(user.userId, new Set());
    }
    connectedUsers.get(user.userId)!.add(socket.id);

    // Join user's personal notification room
    socket.join(`user:${user.userId}`);

    // Join role-based rooms
    socket.join(`role:${user.role}`);

    // Mark notifications as delivered when user connects
    socket.on('mark-delivered', async (data: { notificationIds: string[] }) => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.notification.updateMany({
          where: {
            id: { in: data.notificationIds },
            userId: user.userId,
          },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
          },
        });

        await prisma.$disconnect();
      } catch (error) {
        logger.error('Failed to mark notifications as delivered:', error);
      }
    });

    // Mark notification as read
    socket.on('mark-read', async (data: { notificationId: string }) => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.notification.updateMany({
          where: {
            id: data.notificationId,
            userId: user.userId,
          },
          data: {
            status: 'READ',
            readAt: new Date(),
          },
        });

        await prisma.$disconnect();

        // Notify other devices
        socket.to(`user:${user.userId}`).emit('notification-read', {
          notificationId: data.notificationId,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to mark notification as read:', error);
      }
    });

    // Mark all as read
    socket.on('mark-all-read', async () => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const result = await prisma.notification.updateMany({
          where: {
            userId: user.userId,
            readAt: null,
          },
          data: {
            status: 'READ',
            readAt: new Date(),
          },
        });

        await prisma.$disconnect();

        socket.emit('all-marked-read', {
          count: result.count,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to mark all as read:', error);
      }
    });

    // Get unread count
    socket.on('get-unread-count', async () => {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        const count = await prisma.notification.count({
          where: {
            userId: user.userId,
            readAt: null,
          },
        });

        await prisma.$disconnect();

        socket.emit('unread-count', {
          count,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get unread count:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const userSockets = connectedUsers.get(user.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(user.userId);
        }
      }
      logger.info(`User disconnected from notifications: ${user.userId}`);
    });
  });
}

/**
 * Send real-time notification to a specific user
 */
export async function sendRealTimeNotification(
  userId: string,
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  try {
    const { io } = await import('../server');
    if (io) {
      io.to(`user:${userId}`).emit('new-notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to send real-time notification:', error);
  }
}

/**
 * Send broadcast notification to all users with a specific role
 */
export async function sendBroadcastNotification(
  role: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  try {
    const { io } = await import('../server');
    if (io) {
      io.to(`role:${role}`).emit('broadcast-notification', {
        ...notification,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Failed to send broadcast notification:', error);
  }
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  return connectedUsers.has(userId) && (connectedUsers.get(userId)?.size || 0) > 0;
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount(): number {
  return connectedUsers.size;
}