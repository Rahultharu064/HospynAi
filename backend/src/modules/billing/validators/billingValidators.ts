import { z } from 'zod';
import { PaymentMethod, PaymentStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

// ============================================
// PAYMENT VALIDATORS
// ============================================

export const createPaymentSchema = z.object({
  body: z.object({
    patientId: z.string({
      required_error: 'Patient ID is required',
    }).cuid('Invalid patient ID'),

    appointmentId: z.string().cuid('Invalid appointment ID').optional().nullable(),

    organizationId: z.string().cuid('Invalid organization ID').optional().nullable(),

    amount: z.number({
      required_error: 'Amount is required',
    }).min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount exceeds maximum'),

    tax: z.number().min(0).max(999999.99).optional().default(0),
    discount: z.number().min(0).max(999999.99).optional().default(0),

    currency: z.string().length(3, 'Currency must be 3 characters').optional().default('USD'),

    method: z.nativeEnum(PaymentMethod).optional(),

    description: z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),

    dueDate: z.string().datetime('Invalid date format').optional(),
  }).refine((data) => data.amount > data.discount, {
    message: 'Discount cannot be greater than amount',
    path: ['discount'],
  }),
});

export const processPaymentSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid('Invalid payment ID'),
    method: z.nativeEnum(PaymentMethod, {
      required_error: 'Payment method is required',
    }),
    gatewayTransactionId: z.string().optional(),
    gatewayResponse: z.record(z.any()).optional(),
  }),
});

export const refundPaymentSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid payment ID'),
  }),
  body: z.object({
    amount: z.number().min(0.01).max(999999.99).optional(),
    reason: z.string().max(500).optional(),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid payment ID'),
  }),
});

export const paymentQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('10'),
    patientId: z.string().cuid().optional(),
    appointmentId: z.string().cuid().optional(),
    organizationId: z.string().cuid().optional(),
    status: z.nativeEnum(PaymentStatus).optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    search: z.string().max(200).optional(),
    sortBy: z.enum(['amount', 'status', 'createdAt', 'dueDate', 'paidAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

// ============================================
// SUBSCRIPTION VALIDATORS
// ============================================

export const createSubscriptionSchema = z.object({
  body: z.object({
    organizationId: z.string({
      required_error: 'Organization ID is required',
    }).cuid('Invalid organization ID'),

    plan: z.nativeEnum(SubscriptionPlan, {
      required_error: 'Plan is required',
    }),

    startDate: z.string().datetime().optional(),
    trialDays: z.number().min(0).max(90).optional().default(14),
    maxUsers: z.number().min(1).max(10000).optional(),
    maxBranches: z.number().min(1).max(1000).optional(),
  }),
});

export const updateSubscriptionSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid subscription ID'),
  }),
  body: z.object({
    plan: z.nativeEnum(SubscriptionPlan).optional(),
    status: z.nativeEnum(SubscriptionStatus).optional(),
    maxUsers: z.number().min(1).max(10000).optional(),
    maxBranches: z.number().min(1).max(1000).optional(),
    endDate: z.string().datetime().optional().nullable(),
  }),
});

export const subscriptionIdSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid subscription ID'),
  }),
});

// ============================================
// INVOICE VALIDATORS
// ============================================

export const generateInvoiceSchema = z.object({
  body: z.object({
    paymentId: z.string().cuid('Invalid payment ID'),
  }),
});

// Type exports
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>['body'];
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>['body'];
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>['query'];
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>['body'];
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>['body'];