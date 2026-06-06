import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../modules/auth/services/securityService';
import { AuditService } from '../modules/auth/services/auditService';
import { TooManyRequestsError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Brute force protection middleware
 */
export function bruteForceProtection() {
  const attempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.body.email || 'unknown';
    const now = Date.now();
    const record = attempts.get(identifier);

    if (record && record.blockedUntil > now) {
      const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      
      await AuditService.log({
        userId: req.user?.userId,
        action: 'RATE_LIMIT_EXCEEDED',
        resource: 'AUTH',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        severity: 'WARNING',
        metadata: { identifier, remainingMinutes },
      });

      throw new TooManyRequestsError(
        `Too many attempts. Please try again in ${remainingMinutes} minutes.`
      );
    }

    if (!record || now - record.lastAttempt > 900000) { // 15 minutes window
      attempts.set(identifier, { count: 1, lastAttempt: now, blockedUntil: 0 });
    } else {
      record.count++;
      record.lastAttempt = now;

      if (record.count >= 5) {
        record.blockedUntil = now + 900000; // Block for 15 minutes
        
        await SecurityService.blockIp(req.ip || '', 'Brute force protection', 'system');
      }
    }

    next();
  };
}

/**
 * IP whitelist middleware
 */
export function ipWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || '';
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`Access denied for IP: ${clientIP}`);
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
export function requireReauthentication() {
  return (req: Request, res: Response, next: NextFunction) => {
    const lastAuth = req.headers['x-last-auth'] as string;
    
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