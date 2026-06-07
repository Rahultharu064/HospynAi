import { z } from 'zod';
export declare const createPaymentSchema: z.ZodObject<{
    body: z.ZodEffects<z.ZodObject<{
        patientId: z.ZodString;
        appointmentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        organizationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        amount: z.ZodNumber;
        tax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        discount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        currency: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        method: z.ZodOptional<z.ZodNativeEnum<{
            CASH: "CASH";
            CREDIT_CARD: "CREDIT_CARD";
            DEBIT_CARD: "DEBIT_CARD";
            INSURANCE: "INSURANCE";
            STRIPE: "STRIPE";
            KHALTI: "KHALTI";
            ESEWA: "ESEWA";
            BANK_TRANSFER: "BANK_TRANSFER";
        }>>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        dueDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        patientId: string;
        amount: number;
        tax: number;
        discount: number;
        currency: string;
        organizationId?: string | null | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        description?: string | null | undefined;
        appointmentId?: string | null | undefined;
        dueDate?: string | undefined;
    }, {
        patientId: string;
        amount: number;
        organizationId?: string | null | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        description?: string | null | undefined;
        appointmentId?: string | null | undefined;
        tax?: number | undefined;
        discount?: number | undefined;
        currency?: string | undefined;
        dueDate?: string | undefined;
    }>, {
        patientId: string;
        amount: number;
        tax: number;
        discount: number;
        currency: string;
        organizationId?: string | null | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        description?: string | null | undefined;
        appointmentId?: string | null | undefined;
        dueDate?: string | undefined;
    }, {
        patientId: string;
        amount: number;
        organizationId?: string | null | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        description?: string | null | undefined;
        appointmentId?: string | null | undefined;
        tax?: number | undefined;
        discount?: number | undefined;
        currency?: string | undefined;
        dueDate?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        patientId: string;
        amount: number;
        tax: number;
        discount: number;
        currency: string;
        organizationId?: string | null | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        description?: string | null | undefined;
        appointmentId?: string | null | undefined;
        dueDate?: string | undefined;
    };
}, {
    body: {
        patientId: string;
        amount: number;
        organizationId?: string | null | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        description?: string | null | undefined;
        appointmentId?: string | null | undefined;
        tax?: number | undefined;
        discount?: number | undefined;
        currency?: string | undefined;
        dueDate?: string | undefined;
    };
}>;
export declare const processPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentId: z.ZodString;
        method: z.ZodNativeEnum<{
            CASH: "CASH";
            CREDIT_CARD: "CREDIT_CARD";
            DEBIT_CARD: "DEBIT_CARD";
            INSURANCE: "INSURANCE";
            STRIPE: "STRIPE";
            KHALTI: "KHALTI";
            ESEWA: "ESEWA";
            BANK_TRANSFER: "BANK_TRANSFER";
        }>;
        gatewayTransactionId: z.ZodOptional<z.ZodString>;
        gatewayResponse: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER";
        paymentId: string;
        gatewayTransactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
    }, {
        method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER";
        paymentId: string;
        gatewayTransactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER";
        paymentId: string;
        gatewayTransactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
    };
}, {
    body: {
        method: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER";
        paymentId: string;
        gatewayTransactionId?: string | undefined;
        gatewayResponse?: Record<string, any> | undefined;
    };
}>;
export declare const refundPaymentSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        reason?: string | undefined;
        amount?: number | undefined;
    }, {
        reason?: string | undefined;
        amount?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        reason?: string | undefined;
        amount?: number | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        reason?: string | undefined;
        amount?: number | undefined;
    };
}>;
export declare const paymentIdSchema: z.ZodObject<{
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
export declare const paymentQuerySchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>>;
        patientId: z.ZodOptional<z.ZodString>;
        appointmentId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            PENDING: "PENDING";
            COMPLETED: "COMPLETED";
            FAILED: "FAILED";
            REFUNDED: "REFUNDED";
            PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED";
            CANCELLED: "CANCELLED";
        }>>;
        method: z.ZodOptional<z.ZodNativeEnum<{
            CASH: "CASH";
            CREDIT_CARD: "CREDIT_CARD";
            DEBIT_CARD: "DEBIT_CARD";
            INSURANCE: "INSURANCE";
            STRIPE: "STRIPE";
            KHALTI: "KHALTI";
            ESEWA: "ESEWA";
            BANK_TRANSFER: "BANK_TRANSFER";
        }>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodOptional<z.ZodEnum<["amount", "status", "createdAt", "dueDate", "paidAt"]>>>;
        sortOrder: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "amount" | "dueDate" | "paidAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "COMPLETED" | "CANCELLED" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | undefined;
        organizationId?: string | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        appointmentId?: string | undefined;
    }, {
        search?: string | undefined;
        status?: "COMPLETED" | "CANCELLED" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | undefined;
        organizationId?: string | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "amount" | "dueDate" | "paidAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        appointmentId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortBy: "status" | "createdAt" | "amount" | "dueDate" | "paidAt";
        sortOrder: "asc" | "desc";
        search?: string | undefined;
        status?: "COMPLETED" | "CANCELLED" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | undefined;
        organizationId?: string | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        patientId?: string | undefined;
        appointmentId?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: "COMPLETED" | "CANCELLED" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | undefined;
        organizationId?: string | undefined;
        method?: "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "INSURANCE" | "STRIPE" | "KHALTI" | "ESEWA" | "BANK_TRANSFER" | undefined;
        page?: string | undefined;
        limit?: string | undefined;
        dateFrom?: string | undefined;
        dateTo?: string | undefined;
        sortBy?: "status" | "createdAt" | "amount" | "dueDate" | "paidAt" | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        patientId?: string | undefined;
        appointmentId?: string | undefined;
    };
}>;
export declare const createSubscriptionSchema: z.ZodObject<{
    body: z.ZodObject<{
        organizationId: z.ZodString;
        plan: z.ZodNativeEnum<{
            STARTER: "STARTER";
            PROFESSIONAL: "PROFESSIONAL";
            ENTERPRISE: "ENTERPRISE";
        }>;
        startDate: z.ZodOptional<z.ZodString>;
        trialDays: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        maxUsers: z.ZodOptional<z.ZodNumber>;
        maxBranches: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        organizationId: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        trialDays: number;
        startDate?: string | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
    }, {
        organizationId: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        startDate?: string | undefined;
        trialDays?: number | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        organizationId: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        trialDays: number;
        startDate?: string | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
    };
}, {
    body: {
        organizationId: string;
        plan: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
        startDate?: string | undefined;
        trialDays?: number | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
    };
}>;
export declare const updateSubscriptionSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        plan: z.ZodOptional<z.ZodNativeEnum<{
            STARTER: "STARTER";
            PROFESSIONAL: "PROFESSIONAL";
            ENTERPRISE: "ENTERPRISE";
        }>>;
        status: z.ZodOptional<z.ZodNativeEnum<{
            ACTIVE: "ACTIVE";
            PAST_DUE: "PAST_DUE";
            CANCELLED: "CANCELLED";
            EXPIRED: "EXPIRED";
            TRIAL: "TRIAL";
        }>>;
        maxUsers: z.ZodOptional<z.ZodNumber>;
        maxBranches: z.ZodOptional<z.ZodNumber>;
        endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        status?: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "EXPIRED" | "TRIAL" | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
        endDate?: string | null | undefined;
    }, {
        status?: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "EXPIRED" | "TRIAL" | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
        endDate?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        status?: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "EXPIRED" | "TRIAL" | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
        endDate?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "ACTIVE" | "CANCELLED" | "PAST_DUE" | "EXPIRED" | "TRIAL" | undefined;
        plan?: "STARTER" | "PROFESSIONAL" | "ENTERPRISE" | undefined;
        maxUsers?: number | undefined;
        maxBranches?: number | undefined;
        endDate?: string | null | undefined;
    };
}>;
export declare const subscriptionIdSchema: z.ZodObject<{
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
export declare const generateInvoiceSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        paymentId: string;
    }, {
        paymentId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        paymentId: string;
    };
}, {
    body: {
        paymentId: string;
    };
}>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>['body'];
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>['body'];
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>['query'];
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>['body'];
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>['body'];
//# sourceMappingURL=billingValidators.d.ts.map