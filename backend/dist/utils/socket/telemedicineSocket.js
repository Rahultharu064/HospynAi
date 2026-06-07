"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTelemedicineSocket = setupTelemedicineSocket;
exports.getActiveRooms = getActiveRooms;
exports.getRoomParticipants = getRoomParticipants;
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
const rooms = new Map();
function setupTelemedicineSocket(io) {
    // Authentication middleware for socket
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
        logger_1.default.info(`User connected to telemedicine: ${user.userId} (${socket.id})`);
        // ============================================
        // JOIN ROOM
        // ============================================
        socket.on('join-room', async (data) => {
            const { roomId, role } = data;
            // Join the socket room
            socket.join(roomId);
            // Track participant
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Map());
            }
            rooms.get(roomId).set(user.userId, {
                userId: user.userId,
                socketId: socket.id,
                role,
                joinedAt: new Date(),
                status: 'CONNECTING',
            });
            // Notify other participants
            socket.to(roomId).emit('participant-joined', {
                userId: user.userId,
                role,
                timestamp: new Date().toISOString(),
            });
            // Send current participants list
            const participants = Array.from(rooms.get(roomId).values()).map((p) => ({
                userId: p.userId,
                role: p.role,
                status: p.status,
            }));
            socket.emit('room-joined', {
                roomId,
                participants,
                timestamp: new Date().toISOString(),
            });
            logger_1.default.info(`User ${user.userId} joined room ${roomId} as ${role}`);
        });
        // ============================================
        // WEBRTC SIGNALING
        // ============================================
        socket.on('signal', (data) => {
            const { roomId, signal, type, targetUserId } = data;
            if (targetUserId) {
                // Send to specific user
                const participant = rooms.get(roomId)?.get(targetUserId);
                if (participant) {
                    io.to(participant.socketId).emit('signal', {
                        signal,
                        type,
                        fromUserId: user.userId,
                        timestamp: new Date().toISOString(),
                    });
                }
            }
            else {
                // Broadcast to all others in room
                socket.to(roomId).emit('signal', {
                    signal,
                    type,
                    fromUserId: user.userId,
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // ============================================
        // CHAT MESSAGES
        // ============================================
        socket.on('chat-message', (data) => {
            const { roomId, message, type = 'text', fileUrl } = data;
            const chatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                senderId: user.userId,
                senderRole: user.role,
                message,
                type,
                fileUrl: fileUrl || null,
                timestamp: new Date().toISOString(),
            };
            // Broadcast to entire room including sender
            io.to(roomId).emit('chat-message', chatMessage);
        });
        // ============================================
        // SCREEN SHARING
        // ============================================
        socket.on('start-screen-share', (data) => {
            socket.to(data.roomId).emit('screen-share-started', {
                userId: user.userId,
                timestamp: new Date().toISOString(),
            });
        });
        socket.on('stop-screen-share', (data) => {
            socket.to(data.roomId).emit('screen-share-stopped', {
                userId: user.userId,
                timestamp: new Date().toISOString(),
            });
        });
        // ============================================
        // QUALITY METRICS
        // ============================================
        socket.on('quality-metrics', (data) => {
            logger_1.default.debug(`Quality metrics from ${user.userId}:`, data.metrics);
            // Store metrics for session analysis
            socket.to(data.roomId).emit('participant-quality', {
                userId: user.userId,
                metrics: data.metrics,
                timestamp: new Date().toISOString(),
            });
        });
        // ============================================
        // PARTICIPANT STATUS
        // ============================================
        socket.on('participant-status', (data) => {
            const participant = rooms.get(data.roomId)?.get(user.userId);
            if (participant) {
                participant.status = data.status;
                socket.to(data.roomId).emit('participant-status-changed', {
                    userId: user.userId,
                    status: data.status,
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // ============================================
        // LEAVE ROOM
        // ============================================
        socket.on('leave-room', (data) => {
            handleLeaveRoom(socket, data.roomId, user.userId, data.reason);
        });
        // ============================================
        // DISCONNECT
        // ============================================
        socket.on('disconnect', () => {
            logger_1.default.info(`User disconnected: ${user.userId} (${socket.id})`);
            // Remove from all rooms
            rooms.forEach((participants, roomId) => {
                if (participants.has(user.userId)) {
                    handleLeaveRoom(socket, roomId, user.userId, 'Disconnected');
                }
            });
        });
    });
}
function handleLeaveRoom(socket, roomId, userId, reason) {
    socket.leave(roomId);
    const participants = rooms.get(roomId);
    if (participants) {
        participants.delete(userId);
        if (participants.size === 0) {
            rooms.delete(roomId);
        }
    }
    socket.to(roomId).emit('participant-left', {
        userId,
        reason: reason || 'Left room',
        timestamp: new Date().toISOString(),
    });
    logger_1.default.info(`User ${userId} left room ${roomId}: ${reason || 'No reason'}`);
}
/**
 * Get active rooms info
 */
function getActiveRooms() {
    return rooms;
}
/**
 * Get room participants
 */
function getRoomParticipants(roomId) {
    return rooms.get(roomId);
}
//# sourceMappingURL=telemedicineSocket.js.map