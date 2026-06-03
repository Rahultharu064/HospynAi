"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
// src/services/token.service.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../../config");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
class TokenService {
    static generateAccessToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.accessTokenSecret, {
            expiresIn: config_1.config.jwt.accessTokenExpiry,
            issuer: config_1.config.jwt.issuer,
            audience: config_1.config.jwt.audience,
        });
    }
    static generateRefreshToken() {
        return crypto_1.default.randomBytes(40).toString('hex');
    }
    static async createAuthTokens(userId, email, role, sessionId, rememberMe = false) {
        const payload = {
            userId,
            email,
            role: role,
            sessionId,
        };
        const accessToken = this.generateAccessToken(payload);
        const refreshToken = this.generateRefreshToken();
        // Store refresh token
        const tokenFamily = crypto_1.default.randomBytes(16).toString('hex');
        const expiresIn = rememberMe ? 30 : 7; // days
        await prisma_1.default.refreshToken.create({
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
    static async rotateRefreshToken(oldRefreshToken) {
        const storedToken = await prisma_1.default.refreshToken.findUnique({
            where: { token: oldRefreshToken },
            include: { user: true },
        });
        if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
            // If token was already revoked, revoke entire family (token reuse detection)
            if (storedToken?.revokedAt) {
                await prisma_1.default.refreshToken.updateMany({
                    where: { family: storedToken.family },
                    data: { revokedAt: new Date() },
                });
            }
            throw new errors_1.UnauthorizedError('Invalid refresh token');
        }
        // Revoke the used token
        await prisma_1.default.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });
        // Create new tokens
        const newRefreshToken = this.generateRefreshToken();
        await prisma_1.default.refreshToken.create({
            data: {
                userId: storedToken.userId,
                token: newRefreshToken,
                family: storedToken.family,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        const payload = {
            userId: storedToken.user.id,
            email: storedToken.user.email,
            role: storedToken.user.role,
            sessionId: crypto_1.default.randomUUID(),
        };
        const accessToken = this.generateAccessToken(payload);
        return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 15 * 60,
        };
    }
    static async revokeAllUserTokens(userId) {
        await prisma_1.default.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        await prisma_1.default.session.deleteMany({
            where: { userId },
        });
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=tokenService.js.map