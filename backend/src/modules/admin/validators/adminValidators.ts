import { z } from 'zod';
import { UserRole, UserStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// Organization validators
export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    logo: z.string().url().optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    website: z.string().url().optional().nullable(),
    taxId: z.string().max(50).optional().nullable(),
    settings: z.record(z.any()).optional().nullable(),
    plan: z.nativeEnum(SubscriptionPlan).optional().default(SubscriptionPlan.STARTER),
    trialDays: z.number().min(0).max(90).optional().default(14),
    maxUsers: z.number().min(1).max(10000).optional().default(10),
    maxBranches: z.number().min(1).max(1000).optional().default(1),
    adminEmail: z.string().email('Invalid admin email'),
    adminFirstName: z.string().min(2).max(50),
    adminLastName: z.string().min(2).max(50),
    adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const updateOrganizationSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    logo: z.string().url().optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    website: z.string().url().optional().nullable(),
    taxId: z.string().max(50).optional().nullable(),
    settings: z.record(z.any()).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
});

export const createBranchSchema = z.object({
  body: z.object({
    organizationId: z.string().cuid('Invalid organization ID'),
    name: z.string().min(2).max(100),
    code: z.string().max(20).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    email: z.string().email().optional().nullable(),
    isMainBranch: z.boolean().optional().default(false),
  }),
});

// User management validators
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email().transform((v) => v.toLowerCase()),
    password: z.string().min(8),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    phone: z.string().optional().nullable(),
    role: z.nativeEnum(UserRole),
    organizationId: z.string().cuid().optional().nullable(),
    branchId: z.string().cuid().optional().nullable(),
    status: z.nativeEnum(UserStatus).optional().default(UserStatus.ACTIVE),
    sendWelcomeEmail: z.boolean().optional().default(true),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
  body: z.object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().optional().nullable(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    organizationId: z.string().cuid().optional().nullable(),
    branchId: z.string().cuid().optional().nullable(),
  }),
});

export const bulkUserOperationSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().cuid()).min(1).max(1000),
    action: z.enum(['ACTIVATE', 'DEACTIVATE', 'SUSPEND', 'DELETE', 'CHANGE_ROLE']),
    role: z.nativeEnum(UserRole).optional(),
    reason: z.string().max(500).optional(),
  }),
});

// Query validators
export const organizationQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    search: z.string().optional(),
    status: z.string().optional(),
    plan: z.nativeEnum(SubscriptionPlan).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum(['name', 'createdAt', 'status']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const userQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    search: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    organizationId: z.string().cuid().optional(),
    branchId: z.string().cuid().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    sortBy: z.enum(['firstName', 'lastName', 'email', 'role', 'createdAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const systemConfigSchema = z.object({
  body: z.object({
    key: z.string().min(1).max(100),
    value: z.any(),
    description: z.string().max(500).optional(),
    category: z.string().max(100).optional(),
  }),
});

export const backupSchema = z.object({
  body: z.object({
    type: z.enum(['FULL', 'INCREMENTAL']),
    includeFiles: z.boolean().optional().default(false),
    notes: z.string().max(500).optional(),
  }),
});

// Type exports
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>['body'];
export type CreateBranchInput = z.infer<typeof createBranchSchema>['body'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>['body'];
export type OrganizationQueryInput = z.infer<typeof organizationQuerySchema>['query'];
export type UserQueryInput = z.infer<typeof userQuerySchema>['query'];