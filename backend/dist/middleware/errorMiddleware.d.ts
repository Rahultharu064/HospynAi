import { Request, Response, NextFunction } from 'express';
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare class AsyncHandler {
    static handle(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
}
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=errorMiddleware.d.ts.map