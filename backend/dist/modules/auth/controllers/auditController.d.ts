import { Request, Response } from 'express';
export declare class AuditController {
    static queryLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserTrail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getResourceTrail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static exportLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSecurityConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static blockIp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static unblockIp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static securityScan: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static complianceReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static validatePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static encryptData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static decryptData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static checkIpStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getRetentionPolicies: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static anonymizeData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static cleanupLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=auditController.d.ts.map