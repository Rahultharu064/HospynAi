import { Request, Response } from 'express';
export declare class AiController {
    static agentChat: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static agentTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static executeTool: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static agentHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static uploadDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static ragQuery: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listDocuments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteDocument: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=aiagentController.d.ts.map