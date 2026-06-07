import { z } from 'zod';
export declare const createOrganizationSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        slug: z.ZodString;
        logo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        website: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        taxId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        settings: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        plan: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            STARTER: "STARTER";
            PROFESSIONAL: "PROFESSIONAL";
            ENTERPRISE: "ENTERPRISE";
        }>>>;
        trialDays: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        maxUsers: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        maxBranches: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        adminEmail: z.ZodString;
        adminFirstName: z.ZodString;
        adminLastName: z.ZodString;
        adminPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        slug: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        trialDays: number;
        maxUsers: number;
        maxBranches: number;
        adminEmail: string;
        adminFirstName: string;
        adminLastName: string;
        adminPassword: string;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
    }, {
        name: string;
        slug: string;
        adminEmail: string;
        adminFirstName: string;
        adminLastName: string;
        adminPassword: string;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
        trialDays?: number | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        name: string;
        slug: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        trialDays: number;
        maxUsers: number;
        maxBranches: number;
        adminEmail: string;
        adminFirstName: string;
        adminLastName: string;
        adminPassword: string;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
    };
}, {
    body: {
        name: string;
        slug: string;
        adminEmail: string;
        adminFirstName: string;
        adminLastName: string;
        adminPassword: string;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
        trialDays?: number | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
    };
}>;
export declare const updateOrganizationSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        logo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        website: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        taxId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        settings: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "SUSPENDED"]>>;
    }, "strip", z.ZodTypeAny, {
        email?: string | null | undefined;
        phone?: string | null | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        name?: string | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
    }, {
        email?: string | null | undefined;
        phone?: string | null | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        name?: string | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        email?: string | null | undefined;
        phone?: string | null | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        name?: string | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        email?: string | null | undefined;
        phone?: string | null | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | undefined;
        name?: string | undefined;
        logo?: string | null | undefined;
        address?: string | null | undefined;
        website?: string | null | undefined;
        taxId?: string | null | undefined;
        settings?: Record<string, any> | null | undefined;
    };
}>;
export declare const createBranchSchema: z.ZodObject<{
    body: z.ZodObject<{
        organizationId: z.ZodString;
        name: z.ZodString;
        code: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        isMainBranch: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        organizationId: string;
        name: string;
        isMainBranch: boolean;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        code?: string | null | undefined;
        address?: string | null | undefined;
    }, {
        organizationId: string;
        name: string;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        code?: string | null | undefined;
        address?: string | null | undefined;
        isMainBranch?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        organizationId: string;
        name: string;
        isMainBranch: boolean;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        code?: string | null | undefined;
        address?: string | null | undefined;
    };
}, {
    body: {
        organizationId: string;
        name: string;
        email?: string | null | undefined;
        phone?: string | null | undefined;
        code?: string | null | undefined;
        address?: string | null | undefined;
        isMainBranch?: boolean | undefined;
    };
}>;
export declare const createUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        role: z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            DOCTOR: "DOCTOR";
            NURSE: "NURSE";
            RECEPTIONIST: "RECEPTIONIST";
            PHARMACIST: "PHARMACIST";
            LAB_TECHNICIAN: "LAB_TECHNICIAN";
            PATIENT: "PATIENT";
        }>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            SUSPENDED: "SUSPENDED";
            PENDING_VERIFICATION: "PENDING_VERIFICATION";
        }>>>;
        sendWelcomeEmail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
        password: string;
        sendWelcomeEmail: boolean;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        password: string;
        phone?: string | null | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        sendWelcomeEmail?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
        password: string;
        sendWelcomeEmail: boolean;
        phone?: string | null | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
    };
}, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        password: string;
        phone?: string | null | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
        sendWelcomeEmail?: boolean | undefined;
    };
}>;
export declare const updateUserSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        role: z.ZodOptional<z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            DOCTOR: "DOCTOR";
            NURSE: "NURSE";
            RECEPTIONIST: "RECEPTIONIST";
            PHARMACIST: "PHARMACIST";
            LAB_TECHNICIAN: "LAB_TECHNICIAN";
            PATIENT: "PATIENT";
        }>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            SUSPENDED: "SUSPENDED";
            PENDING_VERIFICATION: "PENDING_VERIFICATION";
        }>>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        branchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
    }, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | null | undefined;
        branchId?: string | null | undefined;
    };
}>;
export declare const bulkUserOperationSchema: z.ZodObject<{
    body: z.ZodObject<{
        userIds: z.ZodArray<z.ZodString, "many">;
        action: z.ZodEnum<["ACTIVATE", "DEACTIVATE", "SUSPEND", "DELETE", "CHANGE_ROLE"]>;
        role: z.ZodOptional<z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            DOCTOR: "DOCTOR";
            NURSE: "NURSE";
            RECEPTIONIST: "RECEPTIONIST";
            PHARMACIST: "PHARMACIST";
            LAB_TECHNICIAN: "LAB_TECHNICIAN";
            PATIENT: "PATIENT";
        }>>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "DELETE" | "CHANGE_ROLE";
        userIds: string[];
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        reason?: string | undefined;
    }, {
        action: "ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "DELETE" | "CHANGE_ROLE";
        userIds: string[];
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        reason?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        action: "ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "DELETE" | "CHANGE_ROLE";
        userIds: string[];
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        reason?: string | undefined;
    };
}, {
    body: {
        action: "ACTIVATE" | "DEACTIVATE" | "SUSPEND" | "DELETE" | "CHANGE_ROLE";
        userIds: string[];
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        reason?: string | undefined;
    };
}>;
export declare const organizationQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        search: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodString>;
        plan: z.ZodOptional<z.ZodNativeEnum<{
            STARTER: "STARTER";
            PROFESSIONAL: "PROFESSIONAL";
            ENTERPRISE: "ENTERPRISE";
        }>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["name", "createdAt", "status"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "name";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
    }, {
        search?: string | undefined;
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "name" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "name";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "name" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
    };
}>;
export declare const userQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        search: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            DOCTOR: "DOCTOR";
            NURSE: "NURSE";
            RECEPTIONIST: "RECEPTIONIST";
            PHARMACIST: "PHARMACIST";
            LAB_TECHNICIAN: "LAB_TECHNICIAN";
            PATIENT: "PATIENT";
        }>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            SUSPENDED: "SUSPENDED";
            PENDING_VERIFICATION: "PENDING_VERIFICATION";
        }>>;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "email", "role", "createdAt"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "email" | "firstName" | "lastName" | "role" | "createdAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    }, {
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "email" | "firstName" | "lastName" | "role" | "createdAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "email" | "firstName" | "lastName" | "role" | "createdAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "email" | "firstName" | "lastName" | "role" | "createdAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    };
}>;
export declare const systemConfigSchema: z.ZodObject<{
    body: z.ZodObject<{
        key: z.ZodString;
        value: z.ZodAny;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        key: string;
        category?: string | undefined;
        value?: any;
        description?: string | undefined;
    }, {
        key: string;
        category?: string | undefined;
        value?: any;
        description?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        key: string;
        category?: string | undefined;
        value?: any;
        description?: string | undefined;
    };
}, {
    body: {
        key: string;
        category?: string | undefined;
        value?: any;
        description?: string | undefined;
    };
}>;
export declare const backupSchema: z.ZodObject<{
    body: z.ZodObject<{
        type: z.ZodEnum<["FULL", "INCREMENTAL"]>;
        includeFiles: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "FULL" | "INCREMENTAL";
        includeFiles: boolean;
        notes?: string | undefined;
    }, {
        type: "FULL" | "INCREMENTAL";
        notes?: string | undefined;
        includeFiles?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type: "FULL" | "INCREMENTAL";
        includeFiles: boolean;
        notes?: string | undefined;
    };
}, {
    body: {
        type: "FULL" | "INCREMENTAL";
        notes?: string | undefined;
        includeFiles?: boolean | undefined;
    };
}>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>['body'];
export type CreateBranchInput = z.infer<typeof createBranchSchema>['body'];
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type BulkUserOperationInput = z.infer<typeof bulkUserOperationSchema>['body'];
export type OrganizationQueryInput = z.infer<typeof organizationQuerySchema>['query'];
export type UserQueryInput = z.infer<typeof userQuerySchema>['query'];
//# sourceMappingURL=adminValidators.d.ts.map