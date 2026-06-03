"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
const validate = (schemas) => {
    return async (req, res, next) => {
        try {
            const errors = {};
            // Validate body
            if (schemas.body) {
                try {
                    req.body = schemas.body.parse(req.body);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        const bodyErrors = formatZodErrors(error, 'body');
                        Object.assign(errors, bodyErrors);
                    }
                }
            }
            // Validate query parameters
            if (schemas.query) {
                try {
                    req.query = schemas.query.parse(req.query);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        const queryErrors = formatZodErrors(error, 'query');
                        Object.assign(errors, queryErrors);
                    }
                }
            }
            // Validate URL params
            if (schemas.params) {
                try {
                    req.params = schemas.params.parse(req.params);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        const paramsErrors = formatZodErrors(error, 'params');
                        Object.assign(errors, paramsErrors);
                    }
                }
            }
            // Validate cookies
            if (schemas.cookies) {
                try {
                    req.cookies = schemas.cookies.parse(req.cookies);
                }
                catch (error) {
                    if (error instanceof zod_1.ZodError) {
                        const cookieErrors = formatZodErrors(error, 'cookies');
                        Object.assign(errors, cookieErrors);
                    }
                }
            }
            // If there are validation errors, throw them
            if (Object.keys(errors).length > 0) {
                logger_1.default.warn('Validation failed', {
                    path: req.path,
                    method: req.method,
                    errors
                });
                throw new errors_1.ValidationError('Validation failed', errors);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
// Format Zod errors into a readable structure
function formatZodErrors(error, source) {
    const formatted = {};
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
const validateBody = (schema) => (0, exports.validate)({ body: schema });
exports.validateBody = validateBody;
const validateQuery = (schema) => (0, exports.validate)({ query: schema });
exports.validateQuery = validateQuery;
const validateParams = (schema) => (0, exports.validate)({ params: schema });
exports.validateParams = validateParams;
//# sourceMappingURL=validateMiddleware.js.map