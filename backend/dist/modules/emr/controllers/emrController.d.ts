import { Request, Response } from 'express';
export declare class EMRController {
    static create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPatientHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static update: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sign: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static newVersion: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generatePDF: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createPrescription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createLabReport: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=emrController.d.ts.map