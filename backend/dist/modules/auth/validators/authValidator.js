"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendOtpSchema = exports.updateProfileSchema = exports.changePasswordSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyOtpSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Custom validation messages
const VALIDATION_MESSAGES = {
    password: {
        min: 'Password must be at least 8 characters',
        max: 'Password must be less than 128 characters',
        uppercase: 'Password must contain at least one uppercase letter',
        lowercase: 'Password must contain at least one lowercase letter',
        number: 'Password must contain at least one number',
        special: 'Password must contain at least one special character',
    },
    email: {
        invalid: 'Invalid email address',
        required: 'Email is required',
        max: 'Email must be less than 255 characters',
    },
    name: {
        required: 'Name is required',
        min: 'Must be at least 2 characters',
        max: 'Must be less than 50 characters',
        format: 'Can only contain letters, spaces, hyphens, and apostrophes',
    },
    phone: {
        format: 'Phone number must be in international format (e.g., +1234567890)',
    },
    otp: {
        length: 'Verification code must be 6 digits',
        format: 'Verification code must contain only digits',
    },
};
// Password validation with detailed requirements
const passwordSchema = zod_1.z
    .string({
    required_error: 'Password is required',
})
    .min(8, VALIDATION_MESSAGES.password.min)
    .max(128, VALIDATION_MESSAGES.password.max)
    .regex(/[A-Z]/, VALIDATION_MESSAGES.password.uppercase)
    .regex(/[a-z]/, VALIDATION_MESSAGES.password.lowercase)
    .regex(/[0-9]/, VALIDATION_MESSAGES.password.number)
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/, VALIDATION_MESSAGES.password.special);
// Email validation
const emailSchema = zod_1.z
    .string({
    required_error: VALIDATION_MESSAGES.email.required,
})
    .email(VALIDATION_MESSAGES.email.invalid)
    .min(5, 'Email must be at least 5 characters')
    .max(255, VALIDATION_MESSAGES.email.max)
    .transform((val) => val.toLowerCase().trim());
// Name validation
const firstNameSchema = zod_1.z
    .string({
    required_error: 'First name is required',
})
    .min(2, VALIDATION_MESSAGES.name.min)
    .max(50, VALIDATION_MESSAGES.name.max)
    .regex(/^[a-zA-Z\s'-]+$/, VALIDATION_MESSAGES.name.format)
    .transform((val) => val.trim());
const lastNameSchema = zod_1.z
    .string({
    required_error: 'Last name is required',
})
    .min(2, VALIDATION_MESSAGES.name.min)
    .max(50, VALIDATION_MESSAGES.name.max)
    .regex(/^[a-zA-Z\s'-]+$/, VALIDATION_MESSAGES.name.format)
    .transform((val) => val.trim());
// Phone validation
const phoneSchema = zod_1.z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, VALIDATION_MESSAGES.phone.format)
    .nullable()
    .optional();
// Register validation
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: zod_1.z.string({
            required_error: 'Password confirmation is required',
        }),
        firstName: firstNameSchema,
        lastName: lastNameSchema,
        phone: zod_1.z.string().regex(/^\+?[1-9]\d{6,14}$/, VALIDATION_MESSAGES.phone.format).nullable().optional(),
        role: zod_1.z.nativeEnum(client_1.UserRole).optional().default(client_1.UserRole.PATIENT),
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional(),
        branchId: zod_1.z.string().cuid('Invalid branch ID').optional(),
        acceptTerms: zod_1.z.boolean().refine((val) => val === true, {
            message: 'You must accept the terms and conditions',
        }),
        acceptPrivacy: zod_1.z.boolean().refine((val) => val === true, {
            message: 'You must accept the privacy policy',
        }),
    }).refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});
// Login validation
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
        password: zod_1.z.string().min(1, 'Password is required'),
        rememberMe: zod_1.z.boolean().optional().default(false),
    }),
});
// OTP verification
exports.verifyOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
        code: zod_1.z
            .string()
            .length(6, VALIDATION_MESSAGES.otp.length)
            .regex(/^\d{6}$/, VALIDATION_MESSAGES.otp.format),
        type: zod_1.z.enum([
            'EMAIL_VERIFICATION',
            'PHONE_VERIFICATION',
            'PASSWORD_RESET',
            'TWO_FACTOR',
        ]),
    }),
});
// Forgot password
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
    }),
});
// Reset password
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Reset token is required'),
        newPassword: passwordSchema,
        confirmPassword: zod_1.z.string({
            required_error: 'Password confirmation is required',
        }),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});
// Change password
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema,
        confirmPassword: zod_1.z.string({
            required_error: 'Password confirmation is required',
        }),
    }).refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    }),
});
// Update profile
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: firstNameSchema.optional(),
        lastName: lastNameSchema.optional(),
        phone: zod_1.z.string().regex(/^\+?[1-9]\d{6,14}$/, VALIDATION_MESSAGES.phone.format).nullable().optional(),
    }).refine((data) => data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined, { message: 'At least one field must be provided' }),
});
// Resend OTP
exports.resendOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: emailSchema,
        type: zod_1.z.enum([
            'EMAIL_VERIFICATION',
            'PHONE_VERIFICATION',
            'PASSWORD_RESET',
            'TWO_FACTOR',
        ]),
        channel: zod_1.z.enum(['EMAIL', 'SMS']).default('EMAIL'),
    }),
});
//# sourceMappingURL=authValidator.js.map