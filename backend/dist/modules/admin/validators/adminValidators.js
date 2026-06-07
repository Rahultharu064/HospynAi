"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupSchema = exports.systemConfigSchema = exports.userQuerySchema = exports.organizationQuerySchema = exports.bulkUserOperationSchema = exports.updateUserSchema = exports.createUserSchema = exports.createBranchSchema = exports.updateOrganizationSchema = exports.createOrganizationSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Organization validators
exports.createOrganizationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(100),
        slug: zod_1.z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
        logo: zod_1.z.string().url().optional().nullable(),
        address: zod_1.z.string().max(500).optional().nullable(),
        phone: zod_1.z.string().max(20).optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        website: zod_1.z.string().url().optional().nullable(),
        taxId: zod_1.z.string().max(50).optional().nullable(),
        settings: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan).optional().default(client_1.SubscriptionPlan.STARTER),
        trialDays: zod_1.z.number().min(0).max(90).optional().default(14),
        maxUsers: zod_1.z.number().min(1).max(10000).optional().default(10),
        maxBranches: zod_1.z.number().min(1).max(1000).optional().default(1),
        adminEmail: zod_1.z.string().email('Invalid admin email'),
        adminFirstName: zod_1.z.string().min(2).max(50),
        adminLastName: zod_1.z.string().min(2).max(50),
        adminPassword: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    }),
});
exports.updateOrganizationSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().cuid() }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(100).optional(),
        logo: zod_1.z.string().url().optional().nullable(),
        address: zod_1.z.string().max(500).optional().nullable(),
        phone: zod_1.z.string().max(20).optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        website: zod_1.z.string().url().optional().nullable(),
        taxId: zod_1.z.string().max(50).optional().nullable(),
        settings: zod_1.z.record(zod_1.z.any()).optional().nullable(),
        status: zod_1.z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    }),
});
exports.createBranchSchema = zod_1.z.object({
    body: zod_1.z.object({
        organizationId: zod_1.z.string().cuid('Invalid organization ID'),
        name: zod_1.z.string().min(2).max(100),
        code: zod_1.z.string().max(20).optional().nullable(),
        address: zod_1.z.string().max(500).optional().nullable(),
        phone: zod_1.z.string().max(20).optional().nullable(),
        email: zod_1.z.string().email().optional().nullable(),
        isMainBranch: zod_1.z.boolean().optional().default(false),
    }),
});
// User management validators
exports.createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email().transform((v) => v.toLowerCase()),
        password: zod_1.z.string().min(8),
        firstName: zod_1.z.string().min(2).max(50),
        lastName: zod_1.z.string().min(2).max(50),
        phone: zod_1.z.string().optional().nullable(),
        role: zod_1.z.nativeEnum(client_1.UserRole),
        organizationId: zod_1.z.string().cuid().optional().nullable(),
        branchId: zod_1.z.string().cuid().optional().nullable(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional().default(client_1.UserStatus.ACTIVE),
        sendWelcomeEmail: zod_1.z.boolean().optional().default(true),
    }),
});
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().cuid() }),
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(2).max(50).optional(),
        lastName: zod_1.z.string().min(2).max(50).optional(),
        phone: zod_1.z.string().optional().nullable(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        organizationId: zod_1.z.string().cuid().optional().nullable(),
        branchId: zod_1.z.string().cuid().optional().nullable(),
    }),
});
exports.bulkUserOperationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userIds: zod_1.z.array(zod_1.z.string().cuid()).min(1).max(1000),
        action: zod_1.z.enum(['ACTIVATE', 'DEACTIVATE', 'SUSPEND', 'DELETE', 'CHANGE_ROLE']),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        reason: zod_1.z.string().max(500).optional(),
    }),
});
// Query validators
exports.organizationQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        search: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
        plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum(['name', 'createdAt', 'status']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.userQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('20'),
        search: zod_1.z.string().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional(),
        status: zod_1.z.nativeEnum(client_1.UserStatus).optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        branchId: zod_1.z.string().cuid().optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        sortBy: zod_1.z.enum(['firstName', 'lastName', 'email', 'role', 'createdAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
exports.systemConfigSchema = zod_1.z.object({
    body: zod_1.z.object({
        key: zod_1.z.string().min(1).max(100),
        value: zod_1.z.any(),
        description: zod_1.z.string().max(500).optional(),
        category: zod_1.z.string().max(100).optional(),
    }),
});
exports.backupSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['FULL', 'INCREMENTAL']),
        includeFiles: zod_1.z.boolean().optional().default(false),
        notes: zod_1.z.string().max(500).optional(),
    }),
});
//# sourceMappingURL=adminValidators.js.map