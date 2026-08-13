import { Prisma, PaymentStatus, PaymentMethod, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import prisma from '../../../config/prisma';
import { AuditService } from '../../auth/services/auditService';
import { EmailService } from '../../auth/services/emailService';
import {
  CreatePaymentInput,
  ProcessPaymentInput,
  PaymentQueryInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../validators/billingValidators';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../../utils/errors';
import {
  PaymentResponse,
  PaymentListResponse,
  SubscriptionResponse,
  InvoiceResponse,
  InvoiceItem,
  RevenueStats,
  PaymentStats,
} from '../../../types/billingTypes';
import logger from '../../../utils/logger';

export class BillingService {
  /**
   * ============================================
   * CREATE PAYMENT / INVOICE
   * ============================================
   */
  static async createPayment(
    data: CreatePaymentInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PaymentResponse> {
    // Validate patient
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        patientId: true,
        email: true,
        organizationId: true,
        deletedAt: true,
      },
    });
    if (!patient || patient.deletedAt) {
      throw new NotFoundError('Patient not found');
    }

    // Validate appointment if provided
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
      });
      if (!appointment) {
        throw new NotFoundError('Appointment not found');
      }
      if (appointment.patientId !== data.patientId) {
        throw new BadRequestError('Appointment does not belong to this patient');
      }
    }

    // Calculate total
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const totalAmount = data.amount + tax - discount;

    if (totalAmount <= 0) {
      throw new BadRequestError('Total amount must be greater than 0');
    }

    // Generate unique invoice ID
    const invoiceId = await this.generateInvoiceId();

    // Set due date (default: 30 days from now)
    const dueDate = data.dueDate 
      ? new Date(data.dueDate) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create payment
    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          invoiceId,
          patientId: data.patientId,
          appointmentId: data.appointmentId || null,
          organizationId: data.organizationId || patient.organizationId,
          amount: data.amount,
          tax,
          discount,
          totalAmount,
          currency: data.currency || 'USD',
          status: PaymentStatus.PENDING,
          method: data.method || null,
          description: data.description || null,
          dueDate,
          createdById: userId,
        },
        include: this.getPaymentInclude(),
      });

      await tx.auditLog.create({
        data: {
          userId,
          organizationId: newPayment.organizationId,
          action: 'PAYMENT_CREATED',
          resource: 'PAYMENT',
          resourceId: newPayment.id,
          ipAddress,
          userAgent,
          metadata: {
            invoiceId: newPayment.invoiceId,
            amount: Number(newPayment.totalAmount),
            patientId: data.patientId,
          },
        },
      });

      return newPayment;
    });

    // Send invoice email (non-blocking)
    if (patient.email) {
      this.sendInvoiceEmail(payment, patient).catch((error) => {
        logger.error('Failed to send invoice email:', error);
      });
    }

    logger.info(`Payment created: ${invoiceId}`);
    return this.formatPaymentResponse(payment);
  }

  /**
   * ============================================
   * PROCESS PAYMENT
   * ============================================
   */
  static async processPayment(
    data: ProcessPaymentInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PaymentResponse> {
    const payment = await prisma.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestError('Payment is already completed');
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new BadRequestError('Cannot process a refunded payment');
    }

    // In a real app, this would call Stripe/Khalti/eSewa API
    // Here we simulate payment processing
    const gatewayResponse = data.gatewayResponse || {
      success: true,
      transactionId: data.gatewayTransactionId || `TXN-${Date.now()}`,
      processedAt: new Date().toISOString(),
    };

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const processed = await tx.payment.update({
        where: { id: data.paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          method: data.method,
          gatewayTransactionId: data.gatewayTransactionId || gatewayResponse.transactionId,
          gatewayResponse,
          paidAt: new Date(),
        },
        include: this.getPaymentInclude(),
      });

      await tx.auditLog.create({
        data: {
          userId,
          organizationId: processed.organizationId,
          action: 'PAYMENT_PROCESSED',
          resource: 'PAYMENT',
          resourceId: processed.id,
          ipAddress,
          userAgent,
          metadata: {
            invoiceId: processed.invoiceId,
            amount: Number(processed.totalAmount),
            method: data.method,
            gatewayTransactionId: processed.gatewayTransactionId,
          },
        },
      });

      return processed;
    });

    // Send payment confirmation
    if (updatedPayment.patient.email) {
      EmailService.sendMail(
        updatedPayment.patient.email,
        `Payment Confirmed - ${updatedPayment.invoiceId}`,
        `<h2>Payment Confirmed</h2><p>Your payment of ${updatedPayment.currency} ${updatedPayment.totalAmount} has been processed successfully.</p><p>Invoice ID: ${updatedPayment.invoiceId}</p>`
      ).catch((error) => logger.error('Failed to send payment confirmation:', error));
    }

    logger.info(`Payment processed: ${payment.invoiceId}`);
    return this.formatPaymentResponse(updatedPayment);
  }

  /**
   * ============================================
   * REFUND PAYMENT
   * ============================================
   */
  static async refundPayment(
    paymentId: string,
    amount: number | undefined,
    reason: string | undefined,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PaymentResponse> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestError('Only completed payments can be refunded');
    }

    const refundAmount = amount || Number(payment.totalAmount);

    if (refundAmount > Number(payment.totalAmount)) {
      throw new BadRequestError('Refund amount cannot exceed paid amount');
    }

    const isFullRefund = refundAmount === Number(payment.totalAmount);
    const newStatus = isFullRefund 
      ? PaymentStatus.REFUNDED 
      : PaymentStatus.PARTIALLY_REFUNDED;

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const refunded = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus,
          refundAmount: refundAmount,
          refundReason: reason || 'Refund requested',
          refundedAt: new Date(),
        },
        include: this.getPaymentInclude(),
      });

      await tx.auditLog.create({
        data: {
          userId,
          organizationId: refunded.organizationId,
          action: 'PAYMENT_REFUNDED',
          resource: 'PAYMENT',
          resourceId: refunded.id,
          ipAddress,
          userAgent,
          metadata: {
            invoiceId: refunded.invoiceId,
            refundAmount,
            reason: reason || 'Not specified',
          },
        },
      });

      return refunded;
    });

    // Send refund notification
    if (updatedPayment.patient.email) {
      EmailService.sendMail(
        updatedPayment.patient.email,
        `Refund Processed - ${updatedPayment.invoiceId}`,
        `<h2>Refund Processed</h2><p>A refund of ${updatedPayment.currency} ${refundAmount} has been processed for invoice ${updatedPayment.invoiceId}.</p>`
      ).catch((error) => logger.error('Failed to send refund email:', error));
    }

    logger.info(`Payment refunded: ${payment.invoiceId}`);
    return this.formatPaymentResponse(updatedPayment);
  }

  /**
   * ============================================
   * LIST PAYMENTS
   * ============================================
   */
  static async listPayments(query: PaymentQueryInput): Promise<PaymentListResponse> {
    const {
      page = 1,
      limit = 10,
      patientId,
      appointmentId,
      organizationId,
      status,
      method,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: Prisma.PaymentWhereInput = {};

    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (organizationId) where.organizationId = organizationId;
    if (status) where.status = status as PaymentStatus;
    if (method) where.method = method as PaymentMethod;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { invoiceId: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { patientId: { contains: search } },
            ],
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: this.getPaymentInclude(),
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments: payments.map((p) => this.formatPaymentResponse(p)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * ============================================
   * GET PAYMENT BY ID
   * ============================================
   */
  static async getPaymentById(id: string): Promise<PaymentResponse> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: this.getPaymentInclude(),
    });

    if (!payment) throw new NotFoundError('Payment not found');
    return this.formatPaymentResponse(payment);
  }

  /**
   * ============================================
   * GENERATE INVOICE PDF
   * ============================================
   */
  static async generateInvoice(paymentId: string): Promise<InvoiceResponse> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        patient: {
          select: { firstName: true, lastName: true, patientId: true, email: true },
        },
        appointment: {
          include: {
            doctor: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!payment) throw new NotFoundError('Payment not found');

    const items: InvoiceItem[] = [];
    
    if (payment.appointment) {
      items.push({
        description: `Consultation - ${payment.appointment.type}`,
        quantity: 1,
        unitPrice: Number(payment.amount),
        amount: Number(payment.amount),
      });
    } else if (payment.description) {
      items.push({
        description: payment.description,
        quantity: 1,
        unitPrice: Number(payment.amount),
        amount: Number(payment.amount),
      });
    }

    return {
      invoiceId: payment.invoiceId,
      patient: payment.patient,
      doctor: payment.appointment?.doctor || null,
      items,
      subtotal: Number(payment.amount),
      tax: Number(payment.tax),
      discount: Number(payment.discount),
      total: Number(payment.totalAmount),
      currency: payment.currency,
      status: payment.status,
      dueDate: payment.dueDate.toISOString(),
      paidAt: payment.paidAt?.toISOString() || null,
      generatedAt: payment.createdAt.toISOString(),
    };
  }

  /**
   * ============================================
   * REVENUE STATISTICS
   * ============================================
   */
  static async getRevenueStats(organizationId?: string): Promise<RevenueStats> {
    const where: Prisma.PaymentWhereInput = {
      status: PaymentStatus.COMPLETED,
      ...(organizationId && { organizationId }),
    };

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const [
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      thisYearRevenue,
      revenueByMethod,
      pendingAmount,
      refundedAmount,
      totalPatients,
    ] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        where,
        _sum: { totalAmount: true },
      }),

      // This month
      prisma.payment.aggregate({
        where: { ...where, paidAt: { gte: thisMonthStart } },
        _sum: { totalAmount: true },
      }),

      // Last month
      prisma.payment.aggregate({
        where: { ...where, paidAt: { gte: lastMonthStart, lt: lastMonthEnd } },
        _sum: { totalAmount: true },
      }),

      // This year
      prisma.payment.aggregate({
        where: { ...where, paidAt: { gte: thisYearStart } },
        _sum: { totalAmount: true },
      }),

      // By method
      prisma.payment.groupBy({
        by: ['method'],
        where,
        _sum: { totalAmount: true },
      }),

      // Pending
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.PENDING },
        _sum: { totalAmount: true },
      }),

      // Refunded
      prisma.payment.aggregate({
        where: { ...where, status: { in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED] } },
        _sum: { refundAmount: true },
      }),

      // Unique patients
      prisma.payment.groupBy({
        by: ['patientId'],
        where,
      }),
    ]);

    const revenueByMethodMap: Record<string, number> = {};
    revenueByMethod.forEach((r) => {
      if (r.method) {
        revenueByMethodMap[r.method] = Number(r._sum.totalAmount || 0);
      }
    });

    return {
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      thisMonth: Number(thisMonthRevenue._sum.totalAmount || 0),
      lastMonth: Number(lastMonthRevenue._sum.totalAmount || 0),
      thisYear: Number(thisYearRevenue._sum.totalAmount || 0),
      averagePerPatient: totalPatients.length > 0 
        ? Number(totalRevenue._sum.totalAmount || 0) / totalPatients.length 
        : 0,
      revenueByMethod: revenueByMethodMap,
      revenueByMonth: [],
      topServices: [],
      pendingAmount: Number(pendingAmount._sum.totalAmount || 0),
      refundedAmount: Number(refundedAmount._sum.refundAmount || 0),
    };
  }

  /**
   * ============================================
   * SUBSCRIPTIONS
   * ============================================
   */
  static async createSubscription(
    data: CreateSubscriptionInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<SubscriptionResponse> {
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    });
    if (!organization) throw new NotFoundError('Organization not found');

    // Check if already has active subscription
    const existingSub = await prisma.subscription.findFirst({
      where: {
        organizationId: data.organizationId,
        status: { in: ['ACTIVE', 'TRIAL'] },
      },
    });
    if (existingSub) {
      throw new ConflictError('Organization already has an active subscription');
    }

    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const trialEndsAt = data.trialDays 
      ? new Date(startDate.getTime() + data.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const planLimits = this.getPlanLimits(data.plan);

    const subscription = await prisma.subscription.create({
      data: {
        organizationId: data.organizationId,
        plan: data.plan,
        status: data.trialDays ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
        startDate,
        trialEndsAt,
        maxUsers: data.maxUsers || planLimits.maxUsers,
        maxBranches: data.maxBranches || planLimits.maxBranches,
        maxStorage: BigInt(planLimits.maxStorage),
        features: planLimits.features,
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    logger.info(`Subscription created for organization: ${organization.name}`);
    return this.formatSubscriptionResponse(subscription);
  }

  static async updateSubscription(
    id: string,
    data: UpdateSubscriptionInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<SubscriptionResponse> {
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) throw new NotFoundError('Subscription not found');

    const updateData: any = {};
    if (data.plan) {
      const limits = this.getPlanLimits(data.plan);
      updateData.plan = data.plan;
      updateData.maxUsers = limits.maxUsers;
      updateData.maxBranches = limits.maxBranches;
      updateData.maxStorage = BigInt(limits.maxStorage);
      updateData.features = limits.features;
    }
    if (data.status) updateData.status = data.status;
    if (data.maxUsers) updateData.maxUsers = data.maxUsers;
    if (data.maxBranches) updateData.maxBranches = data.maxBranches;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;

    const updated = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    return this.formatSubscriptionResponse(updated);
  }

  static async getSubscription(organizationId: string): Promise<SubscriptionResponse> {
    const subscription = await prisma.subscription.findFirst({
      where: { organizationId, status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] } },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!subscription) throw new NotFoundError('No active subscription found');
    return this.formatSubscriptionResponse(subscription);
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private static async generateInvoiceId(): Promise<string> {
    const date = new Date();
    const prefix = `INV${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const count = await prisma.payment.count({
      where: { invoiceId: { startsWith: prefix } },
    });

    return `${prefix}${(count + 1).toString().padStart(5, '0')}`;
  }

  private static getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      STARTER: {
        maxUsers: 10,
        maxBranches: 1,
        maxStorage: 10737418240, // 10GB
        features: { aiVoice: false, blockchain: false, telemedicine: false },
      },
      PROFESSIONAL: {
        maxUsers: 50,
        maxBranches: 5,
        maxStorage: 53687091200, // 50GB
        features: { aiVoice: true, blockchain: true, telemedicine: true },
      },
      ENTERPRISE: {
        maxUsers: 999999,
        maxBranches: 999999,
        maxStorage: 536870912000, // 500GB
        features: { aiVoice: true, blockchain: true, telemedicine: true, customIntegrations: true },
      },
    };
    return limits[plan];
  }

  private static getPaymentInclude(): Prisma.PaymentInclude {
    return {
      patient: {
        select: { id: true, patientId: true, firstName: true, lastName: true, email: true },
      },
      appointment: {
        select: { id: true, appointmentId: true, appointmentDate: true },
      },
      organization: {
        select: { id: true, name: true },
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true },
      },
    };
  }

  private static formatPaymentResponse(payment: any): PaymentResponse {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      patient: payment.patient,
      appointment: payment.appointment,
      organization: payment.organization,
      amount: Number(payment.amount),
      tax: Number(payment.tax),
      discount: Number(payment.discount),
      totalAmount: Number(payment.totalAmount),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      gatewayTransactionId: payment.gatewayTransactionId,
      refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
      refundReason: payment.refundReason,
      refundedAt: payment.refundedAt?.toISOString() || null,
      description: payment.description,
      dueDate: payment.dueDate.toISOString(),
      paidAt: payment.paidAt?.toISOString() || null,
      receiptUrl: payment.receiptUrl,
      createdBy: payment.createdBy,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }

  private static formatSubscriptionResponse(sub: any): SubscriptionResponse {
    return {
      id: sub.id,
      organization: sub.organization,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate.toISOString(),
      endDate: sub.endDate?.toISOString() || null,
      trialEndsAt: sub.trialEndsAt?.toISOString() || null,
      maxUsers: sub.maxUsers,
      maxBranches: sub.maxBranches,
      maxStorage: Number(sub.maxStorage),
      features: sub.features,
      currentUsage: {
        users: 0,
        branches: 0,
        storage: 0,
      },
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    };
  }

  private static async sendInvoiceEmail(payment: any, patient: any): Promise<void> {
    const html = `
      <div style="font-family: Arial; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #1B3A6B, #2563EB); padding: 32px; text-align: center;">
          <h2 style="color: #fff; margin: 0;">Invoice Generated</h2>
        </div>
        <div style="padding: 32px;">
          <p>Dear ${patient.firstName},</p>
          <p>An invoice has been generated for your consultation:</p>
          <div style="background: #f0fdfa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Invoice ID:</strong> ${payment.invoiceId}</p>
            <p><strong>Amount:</strong> ${payment.currency} ${payment.totalAmount}</p>
            <p><strong>Due Date:</strong> ${new Date(payment.dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${payment.status}</p>
          </div>
          <p>Please make payment by the due date to avoid any late fees.</p>
        </div>
      </div>
    `;

    await EmailService.sendMail(patient.email, `Invoice ${payment.invoiceId} - VoiceMed Pro`, html);
  }
}