export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    errors?: Record<string, string[]>;
    constructor(message: string, statusCode: number, isOperational?: boolean, errors?: Record<string, string[]>);
}
export declare class BadRequestError extends AppError {
    constructor(message?: string, errors?: Record<string, string[]>);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(message?: string, errors?: Record<string, string[]>);
}
export declare class TokenExpiredError extends AppError {
    constructor(message?: string);
}
export declare class AccountLockedError extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map