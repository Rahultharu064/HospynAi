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
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const prisma_1 = __importStar(require("./config/prisma"));
const logger_1 = __importDefault(require("./utils/logger"));
// server.ts - Add chatbot WebSocket
const chatbotSocket_1 = require("./utils/socket/chatbotSocket");
const telemedicineSocket_1 = require("./utils/socket/telemedicineSocket");
const notificationSocket_1 = require("./utils/socket/notificationSocket");
const startServer = async () => {
    try {
        await prisma_1.default.$connect();
        logger_1.default.info('📦 Database connected');
        const server = http_1.default.createServer(app_1.default);
        exports.io = new socket_io_1.Server(server);
        server.listen(config_1.config.port, () => {
            logger_1.default.info(`🚀 Server running on port ${config_1.config.port} [${config_1.config.nodeEnv}]`);
        });
        (0, chatbotSocket_1.setupChatbotSocket)(exports.io);
        (0, telemedicineSocket_1.setupTelemedicineSocket)(exports.io);
        (0, notificationSocket_1.setupNotificationSocket)(exports.io);
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`${signal} received. Shutting down...`);
            server.close(async () => {
                await prisma_1.PrismaService.disconnect();
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            gracefulShutdown('UNCAUGHT_EXCEPTION');
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map