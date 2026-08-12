import { z } from 'zod';
import { UserRole } from '@prisma/client';

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
const passwordSchema = z
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
const emailSchema = z
  .string({
    required_error: VALIDATION_MESSAGES.email.required,
  })
  .email(VALIDATION_MESSAGES.email.invalid)
  .min(5, 'Email must be at least 5 characters')
  .max(255, VALIDATION_MESSAGES.email.max)
  .transform((val) => val.toLowerCase().trim());

// Name validation
const firstNameSchema = z
  .string({
    required_error: 'First name is required',
  })
  .min(2, VALIDATION_MESSAGES.name.min)
  .max(50, VALIDATION_MESSAGES.name.max)
  .regex(/^[a-zA-Z\s'-]+$/, VALIDATION_MESSAGES.name.format)
  .transform((val) => val.trim());

const lastNameSchema = z
  .string({
    required_error: 'Last name is required',
  })
  .min(2, VALIDATION_MESSAGES.name.min)
  .max(50, VALIDATION_MESSAGES.name.max)
  .regex(/^[a-zA-Z\s'-]+$/, VALIDATION_MESSAGES.name.format)
  .transform((val) => val.trim());

// Phone validation
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, VALIDATION_MESSAGES.phone.format)
  .nullable()
  .optional();

// Register validation
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string({
      required_error: 'Password confirmation is required',
    }),
    firstName: firstNameSchema,
    lastName: lastNameSchema,
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, VALIDATION_MESSAGES.phone.format).nullable().optional(),
    role: z.nativeEnum(UserRole).optional().default(UserRole.PATIENT),
    organizationId: z.string().cuid('Invalid organization ID').optional(),
    branchId: z.string().cuid('Invalid branch ID').optional(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
    acceptPrivacy: z.boolean().refine((val) => val === true, {
      message: 'You must accept the privacy policy',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Login validation
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  }),
});

// OTP verification
export const verifyOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
    code: z
      .string()
      .length(6, VALIDATION_MESSAGES.otp.length)
      .regex(/^\d{6}$/, VALIDATION_MESSAGES.otp.format),
    type: z.enum([
      'EMAIL_VERIFICATION',
      'PHONE_VERIFICATION',
      'PASSWORD_RESET',
      'TWO_FACTOR',
    ]),
  }),
});

// Forgot password
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Reset password
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string({
      required_error: 'Password confirmation is required',
    }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Change password
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string({
      required_error: 'Password confirmation is required',
    }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Update profile
export const updateProfileSchema = z.object({
  body: z.object({
    firstName: firstNameSchema.optional(),
    lastName: lastNameSchema.optional(),
    phone: z.string().regex(/^\+?[1-9]\d{6,14}$/, VALIDATION_MESSAGES.phone.format).nullable().optional(),
  }).refine(
    (data) => data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined,
    { message: 'At least one field must be provided' }
  ),
});

// Resend OTP
export const resendOtpSchema = z.object({
  body: z.object({
    email: emailSchema,
    type: z.enum([
      'EMAIL_VERIFICATION',
      'PHONE_VERIFICATION',
      'PASSWORD_RESET',
      'TWO_FACTOR',
    ]),
    channel: z.enum(['EMAIL', 'SMS']).default('EMAIL'),
  }),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ResendOtpInput = z.infer<typeof resendOtpSchema>['body'];