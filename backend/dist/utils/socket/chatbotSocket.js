"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatbotSocket = setupChatbotSocket;
exports.getActiveChatUsers = getActiveChatUsers;
const jsonwebtoken_1 = require("jsonwebtoken");
const config_1 = require("../../config");
const chatbotService_1 = require("../../modules/chatbot/services/chatbotService");
const logger_1 = __importDefault(require("../../utils/logger"));
const activeSessions = new Map();
function setupChatbotSocket(io) {
    const chatbotNamespace = io.of('/chatbot');
    // Authentication
    chatbotNamespace.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (!token)
                return next(new Error('Authentication required'));
            const decoded = (0, jsonwebtoken_1.verify)(token, config_1.config.jwt.accessTokenSecret);
            socket.user = decoded;
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    chatbotNamespace.on('connection', (socket) => {
        const user = socket.user;
        logger_1.default.info(`Chatbot WebSocket connected: ${user.userId}`);
        // Track session
        if (!activeSessions.has(user.userId)) {
            activeSessions.set(user.userId, new Set());
        }
        activeSessions.get(user.userId).add(socket.id);
        /**
         * Send text message
         */
        socket.on('send-message', async (data) => {
            try {
                // Send typing indicator
                socket.emit('typing', { status: true });
                const result = await chatbotService_1.ChatbotService.processTextMessage({
                    message: data.message,
                    sessionId: data.sessionId,
                    patientId: data.patientId,
                    context: data.context || 'GENERAL',
                    language: 'en',
                    stream: false,
                }, user.userId, socket.handshake.address);
                socket.emit('typing', { status: false });
                socket.emit('message-received', result);
            }
            catch (error) {
                socket.emit('typing', { status: false });
                socket.emit('error', { message: error.message });
            }
        });
        /**
         * Stream message (token by token)
         */
        socket.on('stream-message', async (data) => {
            try {
                socket.emit('stream-start', { sessionId: data.sessionId });
                await chatbotService_1.ChatbotService.streamTextMessage({
                    message: data.message,
                    sessionId: data.sessionId,
                    patientId: data.patientId,
                    context: data.context || 'GENERAL',
                    language: 'en',
                    stream: true,
                }, user.userId, {
                    onToken: (token) => {
                        socket.emit('stream-token', { token });
                    },
                    onComplete: (response) => {
                        socket.emit('stream-complete', response);
                    },
                    onError: (error) => {
                        socket.emit('stream-error', { message: error.message });
                    },
                });
            }
            catch (error) {
                socket.emit('stream-error', { message: error.message });
            }
        });
        /**
         * Send audio message
         */
        socket.on('send-audio', async (data) => {
            try {
                socket.emit('processing-audio', { status: true });
                const audioBuffer = Buffer.from(data.audio, 'base64');
                const result = await chatbotService_1.ChatbotService.processAudioMessage(audioBuffer, {
                    format: data.format || 'webm',
                    language: 'en',
                    sessionId: data.sessionId,
                    patientId: data.patientId,
                    context: data.context || 'GENERAL',
                }, user.userId, socket.handshake.address);
                socket.emit('processing-audio', { status: false });
                socket.emit('audio-response', result);
            }
            catch (error) {
                socket.emit('processing-audio', { status: false });
                socket.emit('error', { message: error.message });
            }
        });
        /**
         * Get chat history
         */
        socket.on('get-history', async (data) => {
            try {
                const history = await chatbotService_1.ChatbotService.getChatHistory({
                    sessionId: data.sessionId,
                    patientId: data.patientId,
                    page: 1,
                    limit: 50,
                });
                socket.emit('chat-history', history);
            }
            catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
        /**
         * Clear chat history
         */
        socket.on('clear-history', async (data) => {
            try {
                await chatbotService_1.ChatbotService.clearHistory(data.sessionId, data.patientId);
                socket.emit('history-cleared', { success: true });
            }
            catch (error) {
                socket.emit('error', { message: error.message });
            }
        });
        /**
         * Typing indicator
         */
        socket.on('typing', (data) => {
            socket.broadcast.emit('user-typing', {
                userId: user.userId,
                status: data.status,
            });
        });
        /**
         * Disconnect
         */
        socket.on('disconnect', () => {
            const userSockets = activeSessions.get(user.userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    activeSessions.delete(user.userId);
                }
            }
            logger_1.default.info(`Chatbot WebSocket disconnected: ${user.userId}`);
        });
    });
}
function getActiveChatUsers() {
    return activeSessions.size;
}
//# sourceMappingURL=chatbotSocket.js.map