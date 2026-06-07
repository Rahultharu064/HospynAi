import { Request, Response } from 'express';
export declare class BillingController {
    static createPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static processPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static refundPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listPayments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getPayment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generateInvoice: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getRevenue: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static createSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=billingController.d.ts.map