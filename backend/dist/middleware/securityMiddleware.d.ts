import { Request, Response, NextFunction } from 'express';
/**
 * Brute force protection middleware
 */
export declare function bruteForceProtection(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * IP whitelist middleware
 */
export declare function ipWhitelist(allowedIPs: string[]): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Sensitive operation re-authentication middleware
 */
export declare function requireReauthentication(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=securityMiddleware.d.ts.map