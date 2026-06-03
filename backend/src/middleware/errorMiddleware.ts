import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { config } from '../config';
import logger from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.statusCode,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    return res.status(422).json({ success: false, status: 422, message: 'Validation failed', errors });
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ success: false, status: 400, message: 'Database operation failed' });
  }

  return res.status(500).json({
    success: false,
    status: 500,
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
};

export class AsyncHandler {
  static handle(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ success: false, status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
};