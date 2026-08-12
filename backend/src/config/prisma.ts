import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import logger from '../utils/logger';

// Prisma Client Singleton
class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: config.nodeEnv === 'development' 
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
        datasources: {
          db: {
            url: config.database.url,
          },
        },
      });

      // Log connection
      PrismaService.instance.$connect()
        .then(() => {
          logger.info('Database connected successfully');
        })
        .catch((error ) => {
          logger.error('Database connection failed:', error);
        });
    }

    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      logger.info('Database disconnected');
    }
  }
}

const prisma = PrismaService.getInstance();

export default prisma;
export { PrismaService };