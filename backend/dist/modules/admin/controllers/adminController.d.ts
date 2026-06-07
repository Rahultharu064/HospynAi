import { Request, Response } from 'express';
export declare class AdminController {
    static createOrg: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listOrgs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getOrg: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateOrg: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createBranch: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listUsers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateUser: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static bulkUserOp: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static systemHealth: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static platformStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=adminController.d.ts.map