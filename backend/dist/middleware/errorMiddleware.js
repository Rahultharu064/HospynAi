"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.AsyncHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../utils/logger"));
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    logger_1.default.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.statusCode,
            message: err.message,
            ...(err.errors && { errors: err.errors }),
        });
    }
    if (err instanceof zod_1.ZodError) {
        const errors = {};
        err.errors.forEach((e) => {
            const path = e.path.join('.');
            if (!errors[path])
                errors[path] = [];
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
        message: config_1.config.nodeEnv === 'production' ? 'Internal server error' : err.message,
    });
};
exports.errorHandler = errorHandler;
class AsyncHandler {
    static handle(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
}
exports.AsyncHandler = AsyncHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({ success: false, status: 404, message: `Route not found: ${req.method} ${req.originalUrl}` });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorMiddleware.js.map