"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitByUser = exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = __importDefault(require("../utils/logger"));
// (Request augmentation moved to src/types/express.d.ts)
/**
 * Authenticate user by verifying JWT token from Authorization header
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new errors_1.UnauthorizedError('No authorization token provided');
        }
        if (!authHeader.startsWith('Bearer ')) {
            throw new errors_1.UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new errors_1.UnauthorizedError('No token provided');
        }
        // Verify JWT token
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessTokenSecret, {
                issuer: config_1.config.jwt.issuer,
                audience: config_1.config.jwt.audience,
            });
        }
        catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new errors_1.TokenExpiredError('Token has expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new errors_1.UnauthorizedError('Invalid token');
            }
            throw new errors_1.UnauthorizedError('Token verification failed');
        }
        // Verify session exists and is active. decoded.sessionId holds the Session's
        // opaque `token` value (see SessionService.createSession), not its DB `id`.
        const session = await prisma_1.default.session.findUnique({
            where: { token: decoded.sessionId },
        });
        if (!session) {
            logger_1.default.warn(`Session not found: ${decoded.sessionId}`);
            throw new errors_1.UnauthorizedError('Session not found');
        }
        if (session.expiresAt < new Date()) {
            logger_1.default.warn(`Session expired: ${decoded.sessionId}`);
            // Clean up expired session
            await prisma_1.default.session.delete({
                where: { id: session.id },
            });
            throw new errors_1.UnauthorizedError('Session expired');
        }
        // Check if user still exists and is active
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, status: true, role: true },
        });
        if (!user) {
            throw new errors_1.UnauthorizedError('User not found');
        }
        if (user.status === 'SUSPENDED') {
            throw new errors_1.ForbiddenError('Account is suspended');
        }
        if (user.status === 'INACTIVE') {
            throw new errors_1.ForbiddenError('Account is inactive');
        }
        // Update session last activity
        await prisma_1.default.session.update({
            where: { id: session.id },
            data: { lastActivity: new Date() },
        }).catch((error) => {
            logger_1.default.error('Failed to update session activity:', error);
        });
        // Attach user info to request
        req.user = decoded;
        req.sessionId = decoded.sessionId;
        next();
    }
    catch (error) {
        if (error instanceof errors_1.UnauthorizedError ||
            error instanceof errors_1.ForbiddenError ||
            error instanceof errors_1.TokenExpiredError) {
            return next(error);
        }
        next(new errors_1.UnauthorizedError('Authentication failed'));
    }
};
exports.authenticate = authenticate;
/**
 * Authorize user by checking their role against allowed roles
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('Not authenticated'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            logger_1.default.warn(`Access denied for user ${req.user.userId} with role ${req.user.role} to ${req.path}`);
            return next(new errors_1.ForbiddenError('Insufficient permissions'));
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Optional authentication - attaches user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessTokenSecret, {
                    issuer: config_1.config.jwt.issuer,
                    audience: config_1.config.jwt.audience,
                });
                req.user = decoded;
                req.sessionId = decoded.sessionId;
            }
        }
    }
    catch (error) {
        // Silently fail - authentication is optional
        logger_1.default.debug('Optional auth failed:', error);
    }
    next();
};
exports.optionalAuth = optionalAuth;
/**
 * Rate limit by user ID
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 900000) => {
    const requestCounts = new Map();
    return (req, res, next) => {
        const userId = req.user?.userId || req.ip || 'anonymous';
        const now = Date.now();
        const userRequests = requestCounts.get(userId);
        if (!userRequests || now > userRequests.resetTime) {
            requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
            return next();
        }
        if (userRequests.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                status: 429,
                message: 'Too many requests. Please try again later.',
            });
        }
        userRequests.count++;
        next();
    };
};
exports.rateLimitByUser = rateLimitByUser;
//# sourceMappingURL=authMiddleware.js.map