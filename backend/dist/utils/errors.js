"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountLockedError = exports.TokenExpiredError = exports.ValidationError = exports.InternalServerError = exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode, isOperational = true, errors) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class BadRequestError extends AppError {
    constructor(message = 'Bad Request', errors) {
        super(message, 400, true, errors);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too many requests. Please try again later.') {
        super(message, 429);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500, false);
    }
}
exports.InternalServerError = InternalServerError;
class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors) {
        super(message, 422, true, errors);
    }
}
exports.ValidationError = ValidationError;
class TokenExpiredError extends AppError {
    constructor(message = 'Token has expired') {
        super(message, 401);
    }
}
exports.TokenExpiredError = TokenExpiredError;
class AccountLockedError extends AppError {
    constructor(message = 'Account is temporarily locked due to multiple failed attempts') {
        super(message, 423);
    }
}
exports.AccountLockedError = AccountLockedError;
//# sourceMappingURL=errors.js.map