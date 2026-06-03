import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError, TokenExpiredError } from '../utils/errors';
import { TokenPayload } from '../types/authTypes';
import { UserRole } from '@prisma/client';
import prisma from '../config/prisma';
import logger from '../utils/logger';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      sessionId?: string;
    }
  }
}

/**
 * Authenticate user by verifying JWT token from Authorization header
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    // Verify JWT token
    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.jwt.accessTokenSecret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as TokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }

    // Verify session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session) {
      logger.warn(`Session not found: ${decoded.sessionId}`);
      throw new UnauthorizedError('Session not found');
    }

    if (session.expiresAt < new Date()) {
      logger.warn(`Session expired: ${decoded.sessionId}`);
      // Clean up expired session
      await prisma.session.delete({
        where: { id: decoded.sessionId },
      });
      throw new UnauthorizedError('Session expired');
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status === 'SUSPENDED') {
      throw new ForbiddenError('Account is suspended');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenError('Account is inactive');
    }

    // Update session last activity
    await prisma.session.update({
      where: { id: decoded.sessionId },
      data: { lastActivity: new Date() },
    }).catch((error) => {
      logger.error('Failed to update session activity:', error);
    });

    // Attach user info to request
    req.user = decoded;
    req.sessionId = decoded.sessionId;

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError || 
        error instanceof ForbiddenError || 
        error instanceof TokenExpiredError) {
      return next(error);
    }
    next(new UnauthorizedError('Authentication failed'));
  }
};

/**
 * Authorize user by checking their role against allowed roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.userId} with role ${req.user.role} to ${req.path}`);
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token is present, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, config.jwt.accessTokenSecret, {
          issuer: config.jwt.issuer,
          audience: config.jwt.audience,
        }) as TokenPayload;

        req.user = decoded;
        req.sessionId = decoded.sessionId;
      }
    }
  } catch (error) {
    // Silently fail - authentication is optional
    logger.debug('Optional auth failed:', error);
  }
  
  next();
};

/**
 * Rate limit by user ID
 */
export const rateLimitByUser = (maxRequests: number = 100, windowMs: number = 900000) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
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