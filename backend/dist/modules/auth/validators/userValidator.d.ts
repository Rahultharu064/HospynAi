import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
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
        status: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            INACTIVE: "INACTIVE";
            SUSPENDED: "SUSPENDED";
            PENDING_VERIFICATION: "PENDING_VERIFICATION";
        }>>>;
        organizationId: z.ZodString;
        branchId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
        organizationId: string;
        password: string;
        phone?: string | undefined;
        branchId?: string | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        organizationId: string;
        password: string;
        phone?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        branchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
        organizationId: string;
        password: string;
        phone?: string | undefined;
        branchId?: string | undefined;
    };
}, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        organizationId: string;
        password: string;
        phone?: string | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        branchId?: string | undefined;
    };
}>;
export declare const updateUserSchema: z.ZodObject<{
    body: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
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
        branchId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        branchId?: string | undefined;
    }, {
        phone?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        branchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        phone?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        branchId?: string | undefined;
    };
}, {
    body: {
        phone?: string | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        branchId?: string | undefined;
    };
}>;
export declare const userIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
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
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["firstName", "lastName", "email", "createdAt", "lastLoginAt"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        sortBy: "email" | "firstName" | "lastName" | "lastLoginAt" | "createdAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }, {
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        limit?: string | undefined;
        page?: string | undefined;
        sortBy?: "email" | "firstName" | "lastName" | "lastLoginAt" | "createdAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        limit: number;
        page: number;
        sortBy: "email" | "firstName" | "lastName" | "lastLoginAt" | "createdAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
        limit?: string | undefined;
        page?: string | undefined;
        sortBy?: "email" | "firstName" | "lastName" | "lastLoginAt" | "createdAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
    };
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type UserQueryInput = z.infer<typeof userQuerySchema>['query'];
//# sourceMappingURL=userValidator.d.ts.map