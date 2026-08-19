import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import prisma, { PrismaService } from './config/prisma';
import logger from './utils/logger';
// server.ts - Add chatbot WebSocket
import { setupChatbotSocket } from './utils/socket/chatbotSocket';
import { setupTelemedicineSocket } from './utils/socket/telemedicineSocket';
import { setupNotificationSocket } from './utils/socket/notificationSocket';

export let io: SocketIOServer | undefined;

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('📦 Database connected');

    const server = http.createServer(app);
    io = new SocketIOServer(server, {
      cors: {
        origin: config.frontendUrl,
        credentials: true,
      },
    });

    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port} [${config.nodeEnv}]`);
    });

    setupChatbotSocket(io);
    setupTelemedicineSocket(io);
    setupNotificationSocket(io);
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down...`);
      server.close(async () => {
        await PrismaService.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();