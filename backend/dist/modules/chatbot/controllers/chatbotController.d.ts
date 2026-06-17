import { Request, Response } from 'express';
export declare class ChatbotController {
    static sendMessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static streamMessage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendAudio: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static clearHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=chatbotController.d.ts.map