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
class SessionService {
    static async createSession(userId, ipAddress, userAgent, rememberMe = false) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresIn = rememberMe ? 30 : 1; // days
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