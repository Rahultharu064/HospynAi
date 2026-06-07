import { Request, Response } from 'express';
export declare class AppointmentController {
    static create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static update: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static reschedule: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static cancel: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getAvailability: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generateToken: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getDoctorQueue: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getLiveQueue: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static callNext: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static markNoShow: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static complete: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static recalculateQueue: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static bulkUpdateStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendReminders: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=appointmentController.d.ts.map