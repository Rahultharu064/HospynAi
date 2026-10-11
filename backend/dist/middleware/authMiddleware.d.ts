import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
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
 *
 * Runs the same session and account-status checks as `authenticate`. A valid-looking
 * JWT used to be trusted on its own here, so a logged-out, suspended, or deleted
 * user still arrived at downstream handlers as an authenticated `req.user` for the
 * remaining life of their access token.
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Rate limit by user ID
 *
 * Expired buckets are swept on write so the Map can't grow without bound — it was
 * previously keyed by user id or IP and never evicted, which is an unbounded memory
 * leak on a long-running process.
 */
export declare const rateLimitByUser: (maxRequests?: number, windowMs?: number) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=authMiddleware.d.ts.map