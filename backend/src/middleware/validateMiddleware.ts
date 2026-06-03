import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  cookies?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Record<string, string[]> = {};

      // Validate body
      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            const bodyErrors = formatZodErrors(error, 'body');
            Object.assign(errors, bodyErrors);
          }
        }
      }

      // Validate query parameters
      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query) as any;
        } catch (error) {
          if (error instanceof ZodError) {
            const queryErrors = formatZodErrors(error, 'query');
            Object.assign(errors, queryErrors);
          }
        }
      }

      // Validate URL params
      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            const paramsErrors = formatZodErrors(error, 'params');
            Object.assign(errors, paramsErrors);
          }
        }
      }

      // Validate cookies
      if (schemas.cookies) {
        try {
          req.cookies = schemas.cookies.parse(req.cookies);
        } catch (error) {
          if (error instanceof ZodError) {
            const cookieErrors = formatZodErrors(error, 'cookies');
            Object.assign(errors, cookieErrors);
          }
        }
      }

      // If there are validation errors, throw them
      if (Object.keys(errors).length > 0) {
        logger.warn('Validation failed', { 
          path: req.path, 
          method: req.method, 
          errors 
        });
        
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Format Zod errors into a readable structure
function formatZodErrors(error: ZodError, source: string): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.length > 0 
      ? `${source}.${err.path.join('.')}` 
      : source;
    
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(err.message);
  });

  return formatted;
}

// Convenience methods for common validations
export const validateBody = (schema: ZodSchema) => validate({ body: schema });
export const validateQuery = (schema: ZodSchema) => validate({ query: schema });
export const validateParams = (schema: ZodSchema) => validate({ params: schema });