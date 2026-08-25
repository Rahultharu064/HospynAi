// src/services/token.service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from "../../../config"
import { TokenPayload, AuthTokens } from '../../../types/authTypes';
import prisma from '../../../config/prisma';
import { UnauthorizedError } from '../../../utils/errors';

/** How long an access token is valid, in seconds — mirrors config.jwt.accessTokenExpiry. */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** Refresh-token lifetime in days. "Remember me" is what makes a login long-lived. */
export const REFRESH_TOKEN_DAYS = { default: 7, rememberMe: 30 } as const;

export function refreshTokenLifetimeDays(rememberMe: boolean): number {
  return rememberMe ? REFRESH_TOKEN_DAYS.rememberMe : REFRESH_TOKEN_DAYS.default;
}

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

  /**
   * Mint the first access/refresh pair for a freshly created session.
   *
   * The refresh token's `family` is set to the session's opaque token rather than a
   * fresh random value. Both are unguessable random strings, so reuse detection
   * (revoke-everything-sharing-a-family) behaves exactly as before — but it now also
   * tells `rotateRefreshToken` which session a refresh belongs to, which is what
   * lets rotation reuse that session instead of creating a new row every time.
   *
   * @param sessionId the Session's opaque `token` (not its DB id) — this is what
   *   authMiddleware looks up and what ends up in the JWT.
   */
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

    const refreshTokenExpiresAt = new Date(
      Date.now() + refreshTokenLifetimeDays(rememberMe) * 24 * 60 * 60 * 1000
    );

    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        family: sessionId,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Rotate a refresh token, keeping the caller on the same session.
   *
   * Two things this deliberately does not do:
   *
   *  - It does not create a Session row. It used to, on every single refresh, which
   *    left a trail of live sessions that `logout` never reached (it only kills the
   *    current one) and made `activeSessions` on the profile meaningless.
   *  - It does not reset the refresh window to a fixed 7 days. The rotated token
   *    inherits the original's `expiresAt`, so a 30-day "remember me" login stays
   *    30 days, and a rotation can't be used to extend a session indefinitely.
   */
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
      // Replay of an already-revoked token means the token leaked: burn the whole
      // family and the session it belongs to, not just this one token.
      if (storedToken?.revokedAt) {
        await prisma.$transaction([
          prisma.refreshToken.updateMany({
            where: { family: storedToken.family, revokedAt: null },
            data: { revokedAt: new Date() },
          }),
          prisma.session.deleteMany({ where: { token: storedToken.family } }),
        ]);
      }
      throw new UnauthorizedError('Invalid refresh token');
    }

    // The family *is* the session token — see createAuthTokens.
    const sessionToken = storedToken.family;
    const session = await prisma.session.findUnique({ where: { token: sessionToken } });

    if (!session || session.expiresAt < new Date()) {
      // Either the session was revoked out from under this token (logout, password
      // change, admin action) or it idled out. Also covers refresh tokens minted
      // before family carried the session token.
      await prisma.refreshToken.updateMany({
        where: { family: storedToken.family, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedError('Session expired. Please sign in again.');
    }

    if (session.userId !== storedToken.userId) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const newRefreshToken = this.generateRefreshToken();

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          userId: storedToken.userId,
          token: newRefreshToken,
          family: storedToken.family,
          expiresAt: storedToken.expiresAt,
        },
      }),
      prisma.session.update({
        where: { id: session.id },
        data: {
          lastActivity: new Date(),
          // Session and refresh token share one absolute deadline, so a rotation
          // can't outlive its session and vice versa.
          expiresAt: storedToken.expiresAt,
          // Keep the session's provenance current without spawning a new row.
          ...(ipAddress ? { ipAddress } : {}),
          ...(userAgent ? { userAgent } : {}),
        },
      }),
    ]);

    const payload: TokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      sessionId: sessionToken,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: storedToken.expiresAt,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
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

  /** Revoke every refresh token issued against a single session. */
  static async revokeSessionTokens(sessionToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { family: sessionToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
