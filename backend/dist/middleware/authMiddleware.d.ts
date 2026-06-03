import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../types/authTypes';
import { UserRole } from '@prisma/client';
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
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authorize user by checking their role against allowed roles
 */
export declare const authorize: (...allowedRoles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - attaches user if token is present, but doesn't require it
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Rate limit by user ID
 */
export declare const rateLimitByUser: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=authMiddleware.d.ts.map