"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
// src/services/session.service.ts
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../../../config/prisma"));
const logger_1 = __importDefault(require("../../../utils/logger"));
const tokenService_1 = require("./tokenService");
class SessionService {
    /**
     * Create a session and return its opaque token.
     *
     * The returned value is what gets embedded in the JWT as `sessionId` and what
     * authMiddleware looks up — the DB `id` is never used for that.
     *
     * Session lifetime intentionally matches the refresh-token lifetime for the same
     * login (7 days, or 30 with "remember me"). They used to disagree — sessions got
     * 1 day while refresh tokens got 7 — which meant a "remember me" login silently
     * died after a day.
     */
    static async createSession(userId, ipAddress, userAgent, rememberMe = false) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresIn = (0, tokenService_1.refreshTokenLifetimeDays)(rememberMe);
        await prisma_1.default.session.create({
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
    static async validateSession(token) {
        const session = await prisma_1.default.session.findUnique({
            where: { token },
        });
        return !!(session && session.expiresAt > new Date());
    }
    static async invalidateSession(token) {
        await prisma_1.default.session.deleteMany({
            where: { token },
        });
    }
    static async invalidateAllUserSessions(userId) {
        await prisma_1.default.session.deleteMany({
            where: { userId },
        });
    }
    /**
     * List a user's live sessions for the "where you're signed in" view.
     *
     * The opaque token is never returned — it's a bearer credential. `current` is
     * derived by comparing against the caller's own session token server-side.
     */
    static async listActiveSessions(userId, currentSessionToken) {
        const sessions = await prisma_1.default.session.findMany({
            where: { userId, expiresAt: { gt: new Date() } },
            orderBy: { lastActivity: 'desc' },
            select: {
                id: true,
                token: true,
                ipAddress: true,
                userAgent: true,
                lastActivity: true,
                expiresAt: true,
                createdAt: true,
            },
        });
        return sessions.map(({ token, ...session }) => ({
            ...session,
            current: token === currentSessionToken,
        }));
    }
    /**
     * Revoke one session by its DB id, scoped to its owner so a caller can't revoke
     * someone else's session by guessing an id.
     */
    static async revokeSessionById(userId, sessionId) {
        const session = await prisma_1.default.session.findFirst({
            where: { id: sessionId, userId },
            select: { token: true },
        });
        if (!session)
            return false;
        // Refresh tokens carry the session token as their family, so revoking the
        // session also has to revoke that family — otherwise the holder just refreshes
        // straight back into a live session.
        await prisma_1.default.$transaction([
            prisma_1.default.refreshToken.updateMany({
                where: { family: session.token, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
            prisma_1.default.session.deleteMany({ where: { id: sessionId, userId } }),
        ]);
        return true;
    }
    static async cleanupExpiredSessions() {
        const result = await prisma_1.default.session.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        logger_1.default.info(`Cleaned up ${result.count} expired sessions`);
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=sessionService.js.map