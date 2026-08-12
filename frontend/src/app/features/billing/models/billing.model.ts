export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'STRIPE' | 'KHALTI' | 'ESEWA' | 'BANK_TRANSFER';

export interface PaymentResponse {
  id: string;
  invoiceId: string;
  patient: { id: string; patientId: string; firstName: string; lastName: string };
  appointment: { id: string; appointmentId: string; appointmentDate: string } | null;
  organization: { id: string; name: string } | null;
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
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  patientId: string;
  appointmentId?: string;
  amount: number;
  tax?: number;
  discount?: number;
  currency?: string;
  method?: PaymentMethod;
  description?: string;
  dueDate?: string;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  method: PaymentMethod;
  gatewayTransactionId?: string;
}

export interface PaymentQuery {
  page?: number;
  limit?: number;
  patientId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RevenueStats {
  totalRevenue: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  revenueByMethod: Record<string, number>;
  revenueByMonth: { month: string; amount: number }[];
}

export const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'STRIPE', 'KHALTI', 'ESEWA', 'BANK_TRANSFER'];
