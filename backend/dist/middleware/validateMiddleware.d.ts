import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
    cookies?: ZodSchema;
}
export declare const validate: (schemas: ValidationSchemas) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateBody: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateQuery: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validateParams: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=validateMiddleware.d.ts.map