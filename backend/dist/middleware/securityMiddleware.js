"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bruteForceProtection = bruteForceProtection;
exports.ipWhitelist = ipWhitelist;
exports.requireReauthentication = requireReauthentication;
const securityService_1 = require("../modules/auth/services/securityService");
const auditService_1 = require("../modules/auth/services/auditService");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Brute force protection middleware
 */
function bruteForceProtection() {
    const attempts = new Map();
    return async (req, res, next) => {
        const identifier = req.ip || req.body.email || 'unknown';
        const now = Date.now();
        const record = attempts.get(identifier);
        if (record && record.blockedUntil > now) {
            const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
            await auditService_1.AuditService.log({
                userId: req.user?.userId,
                action: 'RATE_LIMIT_EXCEEDED',
                resource: 'AUTH',
                ipAddress: req.ip || '',
                userAgent: req.headers['user-agent'] || '',
                severity: 'WARNING',
                metadata: { identifier, remainingMinutes },
            });
            throw new errors_1.TooManyRequestsError(`Too many attempts. Please try again in ${remainingMinutes} minutes.`);
        }
        if (!record || now - record.lastAttempt > 900000) { // 15 minutes window
            attempts.set(identifier, { count: 1, lastAttempt: now, blockedUntil: 0 });
        }
        else {
            record.count++;
            record.lastAttempt = now;
            if (record.count >= 5) {
                record.blockedUntil = now + 900000; // Block for 15 minutes
                await securityService_1.SecurityService.blockIp(req.ip || '', 'Brute force protection', 'system');
            }
        }
        next();
    };
}
/**
 * IP whitelist middleware
 */
function ipWhitelist(allowedIPs) {
    return (req, res, next) => {
        const clientIP = req.ip || req.connection.remoteAddress || '';
        if (!allowedIPs.includes(clientIP)) {
            logger_1.default.warn(`Access denied for IP: ${clientIP}`);
            return res.status(403).json({
                success: false,
                status: 403,
                message: 'Access denied from this IP address',
            });
        }
        next();
    };
}
/**
 * Sensitive operation re-authentication middleware
 */
function requireReauthentication() {
    return (req, res, next) => {
        const lastAuth = req.headers['x-last-auth'];
        if (lastAuth) {
            const authTime = new Date(lastAuth).getTime();
            const now = Date.now();
            if (now - authTime > 300000) { // 5 minutes
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: 'Re-authentication required for this operation',
                    requireReauth: true,
                });
            }
        }
        next();
    };
}
//# sourceMappingURL=securityMiddleware.js.map