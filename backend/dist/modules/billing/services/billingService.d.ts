import { CreatePaymentInput, ProcessPaymentInput, PaymentQueryInput, CreateSubscriptionInput, UpdateSubscriptionInput } from '../validators/billingValidators';
import { PaymentResponse, PaymentListResponse, SubscriptionResponse, InvoiceResponse, RevenueStats } from '../../../types/billingTypes';
export declare class BillingService {
    /**
     * ============================================
     * CREATE PAYMENT / INVOICE
     * ============================================
     */
    static createPayment(data: CreatePaymentInput, userId: string, ipAddress: string, userAgent: string): Promise<PaymentResponse>;
    /**
     * ============================================
     * PROCESS PAYMENT
     * ============================================
     */
    static processPayment(data: ProcessPaymentInput, userId: string, ipAddress: string, userAgent: string): Promise<PaymentResponse>;
    /**
     * ============================================
     * REFUND PAYMENT
     * ============================================
     */
    static refundPayment(paymentId: string, amount: number | undefined, reason: string | undefined, userId: string, ipAddress: string, userAgent: string): Promise<PaymentResponse>;
    /**
     * ============================================
     * LIST PAYMENTS
     * ============================================
     */
    static listPayments(query: PaymentQueryInput): Promise<PaymentListResponse>;
    /**
     * ============================================
     * GET PAYMENT BY ID
     * ============================================
     */
    static getPaymentById(id: string): Promise<PaymentResponse>;
    /**
     * ============================================
     * GENERATE INVOICE PDF
     * ============================================
     */
    static generateInvoice(paymentId: string): Promise<InvoiceResponse>;
    /**
     * ============================================
     * REVENUE STATISTICS
     * ============================================
     */
    static getRevenueStats(organizationId?: string): Promise<RevenueStats>;
    /**
     * ============================================
     * SUBSCRIPTIONS
     * ============================================
     */
    static createSubscription(data: CreateSubscriptionInput, userId: string, ipAddress: string, userAgent: string): Promise<SubscriptionResponse>;
    static updateSubscription(id: string, data: UpdateSubscriptionInput, userId: string, ipAddress: string, userAgent: string): Promise<SubscriptionResponse>;
    static getSubscription(organizationId: string): Promise<SubscriptionResponse>;
    private static generateInvoiceId;
    private static getPlanLimits;
    private static getPaymentInclude;
    private static formatPaymentResponse;
    private static formatSubscriptionResponse;
    private static sendInvoiceEmail;
}
//# sourceMappingURL=billingService.d.ts.map