"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoiceSchema = exports.subscriptionIdSchema = exports.updateSubscriptionSchema = exports.createSubscriptionSchema = exports.paymentQuerySchema = exports.paymentIdSchema = exports.refundPaymentSchema = exports.processPaymentSchema = exports.createPaymentSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// ============================================
// PAYMENT VALIDATORS
// ============================================
exports.createPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        patientId: zod_1.z.string({
            required_error: 'Patient ID is required',
        }).cuid('Invalid patient ID'),
        appointmentId: zod_1.z.string().cuid('Invalid appointment ID').optional().nullable(),
        organizationId: zod_1.z.string().cuid('Invalid organization ID').optional().nullable(),
        amount: zod_1.z.number({
            required_error: 'Amount is required',
        }).min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount exceeds maximum'),
        tax: zod_1.z.number().min(0).max(999999.99).optional().default(0),
        discount: zod_1.z.number().min(0).max(999999.99).optional().default(0),
        currency: zod_1.z.string().length(3, 'Currency must be 3 characters').optional().default('USD'),
        method: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        description: zod_1.z.string().max(500, 'Description must be less than 500 characters').optional().nullable(),
        dueDate: zod_1.z.string().datetime('Invalid date format').optional(),
    }).refine((data) => data.amount > data.discount, {
        message: 'Discount cannot be greater than amount',
        path: ['discount'],
    }),
});
exports.processPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID'),
        method: zod_1.z.nativeEnum(client_1.PaymentMethod, {
            required_error: 'Payment method is required',
        }),
        gatewayTransactionId: zod_1.z.string().optional(),
        gatewayResponse: zod_1.z.record(zod_1.z.any()).optional(),
    }),
});
exports.refundPaymentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid payment ID'),
    }),
    body: zod_1.z.object({
        amount: zod_1.z.number().min(0.01).max(999999.99).optional(),
        reason: zod_1.z.string().max(500).optional(),
    }),
});
exports.paymentIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid payment ID'),
    }),
});
exports.paymentQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1)).optional().default('1'),
        limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(1).max(100)).optional().default('10'),
        patientId: zod_1.z.string().cuid().optional(),
        appointmentId: zod_1.z.string().cuid().optional(),
        organizationId: zod_1.z.string().cuid().optional(),
        status: zod_1.z.nativeEnum(client_1.PaymentStatus).optional(),
        method: zod_1.z.nativeEnum(client_1.PaymentMethod).optional(),
        dateFrom: zod_1.z.string().datetime().optional(),
        dateTo: zod_1.z.string().datetime().optional(),
        search: zod_1.z.string().max(200).optional(),
        sortBy: zod_1.z.enum(['amount', 'status', 'createdAt', 'dueDate', 'paidAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc'),
    }),
});
// ============================================
// SUBSCRIPTION VALIDATORS
// ============================================
exports.createSubscriptionSchema = zod_1.z.object({
    body: zod_1.z.object({
        organizationId: zod_1.z.string({
            required_error: 'Organization ID is required',
        }).cuid('Invalid organization ID'),
        plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan, {
            required_error: 'Plan is required',
        }),
        startDate: zod_1.z.string().datetime().optional(),
        trialDays: zod_1.z.number().min(0).max(90).optional().default(14),
        maxUsers: zod_1.z.number().min(1).max(10000).optional(),
        maxBranches: zod_1.z.number().min(1).max(1000).optional(),
    }),
});
exports.updateSubscriptionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid subscription ID'),
    }),
    body: zod_1.z.object({
        plan: zod_1.z.nativeEnum(client_1.SubscriptionPlan).optional(),
        status: zod_1.z.nativeEnum(client_1.SubscriptionStatus).optional(),
        maxUsers: zod_1.z.number().min(1).max(10000).optional(),
        maxBranches: zod_1.z.number().min(1).max(1000).optional(),
        endDate: zod_1.z.string().datetime().optional().nullable(),
    }),
});
exports.subscriptionIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().cuid('Invalid subscription ID'),
    }),
});
// ============================================
// INVOICE VALIDATORS
// ============================================
exports.generateInvoiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentId: zod_1.z.string().cuid('Invalid payment ID'),
    }),
});
//# sourceMappingURL=billingValidators.js.map