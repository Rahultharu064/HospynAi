import { PaymentStatus, PaymentMethod, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
export interface CreatePaymentDto {
    patientId: string;
    appointmentId?: string;
    organizationId?: string;
    amount: number;
    tax?: number;
    discount?: number;
    currency?: string;
    method?: PaymentMethod;
    description?: string;
    dueDate?: string;
}
export interface ProcessPaymentDto {
    paymentId: string;
    method: PaymentMethod;
    gatewayTransactionId?: string;
    gatewayResponse?: Record<string, any>;
}
export interface RefundPaymentDto {
    paymentId: string;
    amount?: number;
    reason?: string;
}
export interface PaymentQueryDto {
    page?: number;
    limit?: number;
    patientId?: string;
    appointmentId?: string;
    organizationId?: string;
    status?: PaymentStatus;
    method?: PaymentMethod;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaymentResponse {
    id: string;
    invoiceId: string;
    patient: {
        id: string;
        patientId: string;
        firstName: string;
        lastName: string;
    };
    appointment: {
        id: string;
        appointmentId: string;
        appointmentDate: string;
    } | null;
    organization: {
        id: string;
        name: string;
    } | null;
    amount: number;
    tax: number;
    discount: number;
    totalAmount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod | null;
    gatewayTransactionId: string | null;
    refundAmount: number | null;
    refundReason: string | null;
    refundedAt: string | null;
    description: string | null;
    dueDate: string;
    paidAt: string | null;
    receiptUrl: string | null;
    createdBy: {
        id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    updatedAt: string;
}
export interface PaymentListResponse {
    payments: PaymentResponse[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface CreateSubscriptionDto {
    organizationId: string;
    plan: SubscriptionPlan;
    startDate?: string;
    trialDays?: number;
    maxUsers?: number;
    maxBranches?: number;
}
export interface UpdateSubscriptionDto {
    plan?: SubscriptionPlan;
    status?: SubscriptionStatus;
    maxUsers?: number;
    maxBranches?: number;
    endDate?: string;
}
export interface SubscriptionResponse {
    id: string;
    organization: {
        id: string;
        name: string;
        slug: string;
    };
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string | null;
    trialEndsAt: string | null;
    maxUsers: number;
    maxBranches: number;
    maxStorage: number;
    features: Record<string, any> | null;
    currentUsage: {
        users: number;
        branches: number;
        storage: number;
    };
    createdAt: string;
    updatedAt: string;
}
export interface InvoiceResponse {
    invoiceId: string;
    patient: {
        firstName: string;
        lastName: string;
        patientId: string;
    };
    doctor: {
        firstName: string;
        lastName: string;
    } | null;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
    status: PaymentStatus;
    dueDate: string;
    paidAt: string | null;
    generatedAt: string;
}
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}
export interface RevenueStats {
    totalRevenue: number;
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
    averagePerPatient: number;
    revenueByMethod: Record<string, number>;
    revenueByMonth: MonthlyRevenue[];
    topServices: ServiceRevenue[];
    pendingAmount: number;
    refundedAmount: number;
}
export interface MonthlyRevenue {
    month: string;
    revenue: number;
    count: number;
}
export interface ServiceRevenue {
    service: string;
    revenue: number;
    count: number;
}
export interface PaymentStats {
    totalPayments: number;
    completedPayments: number;
    pendingPayments: number;
    failedPayments: number;
    refundedPayments: number;
    collectionRate: number;
    averagePaymentTime: number;
}
//# sourceMappingURL=billingTypes.d.ts.map