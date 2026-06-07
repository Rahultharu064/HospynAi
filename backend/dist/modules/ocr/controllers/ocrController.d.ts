import { Request, Response } from 'express';
export declare class OcrController {
    static scanDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static scanPrescription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static verifyData: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listResults: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=ocrController.d.ts.map