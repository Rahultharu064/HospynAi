import { Request, Response } from 'express';
export declare class NotificationController {
    static create: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static bulkSend: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static markAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static markAllAsRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static delete: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendReminders: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=notificationController.d.ts.map