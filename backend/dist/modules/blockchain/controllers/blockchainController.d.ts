import { Request, Response } from 'express';
export declare class BlockchainController {
    static anchorHash: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static verify: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listRecords: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getRecord: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPatientLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static grantConsent: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static revokeConsent: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=blockchainController.d.ts.map