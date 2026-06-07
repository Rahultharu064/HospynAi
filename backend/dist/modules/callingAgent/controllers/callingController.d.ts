import { Request, Response } from 'express';
export declare class CallingController {
    static initiateCall: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static transferToHuman: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static callLogs: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static transcript: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static stats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static activeCalls: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=callingController.d.ts.map