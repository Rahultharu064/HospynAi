"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupNotificationSocket = setupNotificationSocket;
exports.sendRealTimeNotification = sendRealTimeNotification;
exports.sendBroadcastNotification = sendBroadcastNotification;
exports.isUserConnected = isUserConnected;
exports.getConnectedUsersCount = getConnectedUsersCount;
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
// Track connected users and their socket IDs
const connectedUsers = new Map();
function setupNotificationSocket(io) {
    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const decoded = (0, jsonwebtoken_1.verify)(token, config_1.config.jwt.accessTokenSecret);
            socket.user = decoded;
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const user = socket.user;
        logger_1.default.info(`User connected for notifications: ${user.userId}`);
        // Track user connection
        if (!connectedUsers.has(user.userId)) {
            connectedUsers.set(user.userId, new Set());
        }
        connectedUsers.get(user.userId).add(socket.id);
        // Join user's personal notification room
        socket.join(`user:${user.userId}`);
        // Join role-based rooms
        socket.join(`role:${user.role}`);
        // Mark notifications as delivered when user connects
        socket.on('mark-delivered', async (data) => {
            try {
                const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
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
            }
            catch (error) {
                logger_1.default.error('Failed to mark notifications as delivered:', error);
            }
        });
        // Mark notification as read
        socket.on('mark-read', async (data) => {
            try {
                const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
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
            }
            catch (error) {
                logger_1.default.error('Failed to mark notification as read:', error);
            }
        });
        // Mark all as read
        socket.on('mark-all-read', async () => {
            try {
                const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
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
            }
            catch (error) {
                logger_1.default.error('Failed to mark all as read:', error);
            }
        });
        // Get unread count
        socket.on('get-unread-count', async () => {
            try {
                const { PrismaClient } = await Promise.resolve().then(() => __importStar(require('@prisma/client')));
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
            }
            catch (error) {
                logger_1.default.error('Failed to get unread count:', error);
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
            logger_1.default.info(`User disconnected from notifications: ${user.userId}`);
        });
    });
}
/**
 * Send real-time notification to a specific user
 */
async function sendRealTimeNotification(userId, notification) {
    try {
        const { io } = await Promise.resolve().then(() => __importStar(require('../../server')));
        if (io) {
            io.to(`user:${userId}`).emit('new-notification', {
                ...notification,
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to send real-time notification:', error);
    }
}
/**
 * Send broadcast notification to all users with a specific role
 */
async function sendBroadcastNotification(role, notification) {
    try {
        const { io } = await Promise.resolve().then(() => __importStar(require('../../server')));
        if (io) {
            io.to(`role:${role}`).emit('broadcast-notification', {
                ...notification,
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        logger_1.default.error('Failed to send broadcast notification:', error);
    }
}
/**
 * Check if user is connected
 */
function isUserConnected(userId) {
    return connectedUsers.has(userId) && (connectedUsers.get(userId)?.size || 0) > 0;
}
/**
 * Get connected users count
 */
function getConnectedUsersCount() {
    return connectedUsers.size;
}
//# sourceMappingURL=notificationSocket.js.map