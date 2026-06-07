import { Request, Response } from 'express';
export declare class PatientController {
    static create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getByPatientId: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static update: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static delete: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static bulkImport: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static uploadDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=patientController.d.ts.map