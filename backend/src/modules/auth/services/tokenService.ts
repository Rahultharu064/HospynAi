// src/services/token.service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from "../../../config"
import { TokenPayload, AuthTokens } from '../../../types/authTypes';
import prisma from '../../../config/prisma';
import { UnauthorizedError } from '../../../utils/errors';
import { SessionService } from './sessionService';

export class TokenService {
  static generateAccessToken(payload: TokenPayload): string {
    const options: jwt.SignOptions = {
      expiresIn: config.jwt.accessTokenExpiry as jwt.SignOptions['expiresIn'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    };
    return jwt.sign(payload, config.jwt.accessTokenSecret, options);
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  static async createAuthTokens(
    userId: string,
    email: string,
    role: string,
    sessionId: string,
    rememberMe: boolean = false
  ): Promise<AuthTokens> {
    const payload: TokenPayload = {
      userId,
      email,
      role: role as any,
      sessionId,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    const tokenFamily = crypto.randomBytes(16).toString('hex');
    const expiresIn = rememberMe ? 30 : 7; // days

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        family: tokenFamily,
        expiresAt: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  static async rotateRefreshToken(
    oldRefreshToken: string,
    ipAddress: string = '',
    userAgent: string = ''
  ): Promise<AuthTokens> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      // If token was already revoked, revoke entire family (token reuse detection)
      if (storedToken?.revokedAt) {
        await prisma.refreshToken.updateMany({
          where: { family: storedToken.family },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Revoke the used token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Create new tokens
    const newRefreshToken = this.generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: storedToken.userId,
        token: newRefreshToken,
        family: storedToken.family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // A refreshed access token needs its own real Session row — a bare random
    // UUID here would never match anything authMiddleware looks up.
    const sessionId = await SessionService.createSession(
      storedToken.user.id,
      ipAddress,
      userAgent
    );

    const payload: TokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      sessionId,
    };

    const accessToken = this.generateAccessToken(payload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 15 * 60,
    };
  }

  static async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}