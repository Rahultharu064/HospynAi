import { Request, Response } from 'express';
export declare class InventoryController {
    static addItem: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listItems: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getItem: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateItem: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stockIn: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stockOut: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static dispense: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static expiryAlerts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static reorderRecommendations: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static movements: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=inventoryController.d.ts.map