import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
        password: z.ZodString;
        confirmPassword: z.ZodString;
        firstName: z.ZodEffects<z.ZodString, string, string>;
        lastName: z.ZodEffects<z.ZodString, string, string>;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        role: z.ZodDefault<z.ZodOptional<z.ZodNativeEnum<{
            SUPER_ADMIN: "SUPER_ADMIN";
            ADMIN: "ADMIN";
            DOCTOR: "DOCTOR";
            NURSE: "NURSE";
            RECEPTIONIST: "RECEPTIONIST";
            PHARMACIST: "PHARMACIST";
            LAB_TECHNICIAN: "LAB_TECHNICIAN";
            PATIENT: "PATIENT";
        }>>>;
        organizationId: z.ZodOptional<z.ZodString>;
        branchId: z.ZodOptional<z.ZodString>;
        acceptTerms: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
        acceptPrivacy: z.ZodEffects<z.ZodBoolean, boolean, boolean>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        password: string;
        confirmPassword: string;
        acceptTerms: boolean;
        acceptPrivacy: boolean;
        phone?: string | null | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        confirmPassword: string;
        acceptTerms: boolean;
        acceptPrivacy: boolean;
        phone?: string | null | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }>, {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        password: string;
        confirmPassword: string;
        acceptTerms: boolean;
        acceptPrivacy: boolean;
        phone?: string | null | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }, {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        confirmPassword: string;
        acceptTerms: boolean;
        acceptPrivacy: boolean;
        phone?: string | null | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT";
        password: string;
        confirmPassword: string;
        acceptTerms: boolean;
        acceptPrivacy: boolean;
        phone?: string | null | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    };
}, {
    body: {
        email: string;
        firstName: string;
        lastName: string;
        password: string;
        confirmPassword: string;
        acceptTerms: boolean;
        acceptPrivacy: boolean;
        phone?: string | null | undefined;
        role?: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST" | "LAB_TECHNICIAN" | "PATIENT" | undefined;
        organizationId?: string | undefined;
        branchId?: string | undefined;
    };
}>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
        password: z.ZodString;
        rememberMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        rememberMe: boolean;
    }, {
        email: string;
        password: string;
        rememberMe?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
        rememberMe: boolean;
    };
}, {
    body: {
        email: string;
        password: string;
        rememberMe?: boolean | undefined;
    };
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
        code: z.ZodString;
        type: z.ZodEnum<["EMAIL_VERIFICATION", "PHONE_VERIFICATION", "PASSWORD_RESET", "TWO_FACTOR"]>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        code: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
    }, {
        email: string;
        code: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        code: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
    };
}, {
    body: {
        email: string;
        code: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
    };
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
    };
}, {
    body: {
        email: string;
    };
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        token: z.ZodString;
        newPassword: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
        confirmPassword: string;
        newPassword: string;
    }, {
        token: string;
        confirmPassword: string;
        newPassword: string;
    }>, {
        token: string;
        confirmPassword: string;
        newPassword: string;
    }, {
        token: string;
        confirmPassword: string;
        newPassword: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        token: string;
        confirmPassword: string;
        newPassword: string;
    };
}, {
    body: {
        token: string;
        confirmPassword: string;
        newPassword: string;
    };
}>;
export declare const changePasswordSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
        confirmPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        confirmPassword: string;
        newPassword: string;
        currentPassword: string;
    }, {
        confirmPassword: string;
        newPassword: string;
        currentPassword: string;
    }>, {
        confirmPassword: string;
        newPassword: string;
        currentPassword: string;
    }, {
        confirmPassword: string;
        newPassword: string;
        currentPassword: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        confirmPassword: string;
        newPassword: string;
        currentPassword: string;
    };
}, {
    body: {
        confirmPassword: string;
        newPassword: string;
        currentPassword: string;
    };
}>;
export declare const updateProfileSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        firstName: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        lastName: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }>, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }, {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    };
}, {
    body: {
        phone?: string | null | undefined;
        firstName?: string | undefined;
        lastName?: string | undefined;
    };
}>;
export declare const resendOtpSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodEffects<z.ZodString, string, string>;
        type: z.ZodEnum<["EMAIL_VERIFICATION", "PHONE_VERIFICATION", "PASSWORD_RESET", "TWO_FACTOR"]>;
        channel: z.ZodDefault<z.ZodEnum<["EMAIL", "SMS"]>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
        channel: "EMAIL" | "SMS";
    }, {
        email: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
        channel?: "EMAIL" | "SMS" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
        channel: "EMAIL" | "SMS";
    };
}, {
    body: {
        email: string;
        type: "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET" | "TWO_FACTOR";
        channel?: "EMAIL" | "SMS" | undefined;
    };
}>;
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ResendOtpInput = z.infer<typeof resendOtpSchema>['body'];
//# sourceMappingURL=authValidator.d.ts.map