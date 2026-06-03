"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userQuerySchema = exports.userIdParamSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
// src/validators/user.validator.ts
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email'),
        password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
        firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
        lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional().default(client_1.UserStatus.PENDING_VERIFICATION),
        organizationId: zod_1.z.string().cuid('Invalid organization ID'),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional(),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2).optional(),
        lastName: zod_1.z.string().min(2).optional(),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        branchId: zod_1.z.string().cuid().optional(),
    }),
});
exports.userIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid user ID'),
    }),
});
exports.userQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        search: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        sortBy: zod_1.z.enum(['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
//# sourceMappingURL=userValidator.js.map