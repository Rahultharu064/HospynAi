// src/services/session.service.ts
import crypto from 'crypto';
import prisma from '../../../config/prisma';
import logger from '../../../utils/logger';

export class SessionService {
  static async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean = false
  ): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresIn = rememberMe ? 30 : 1; // days

    await prisma.session.create({
      data: {
        userId,
        token,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  static async validateSession(token: string): Promise<boolean> {
    const session = await prisma.session.findUnique({
      where: { token },
    });

    return !!(session && session.expiresAt > new Date());
  }

  static async invalidateSession(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  static async cleanupExpiredSessions(): Promise<void> {
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    
    logger.info(`Cleaned up ${result.count} expired sessions`);
  }
}