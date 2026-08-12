import { Request, Response } from 'express';
import { BillingService } from '../services/billingService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
import {
  CreatePaymentInput,
  ProcessPaymentInput,
  PaymentQueryInput,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from '../validators/billingValidators';

export class BillingController {
  // ============================================
  // PAYMENTS
  // ============================================

  // POST /api/v1/billing/payments
  static createPayment = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreatePaymentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const payment = await BillingService.createPayment(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true, status: 201, message: 'Payment created successfully', data: payment,
    });
  });

  // POST /api/v1/billing/payments/process
  static processPayment = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ProcessPaymentInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const payment = await BillingService.processPayment(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true, status: 200, message: 'Payment processed successfully', data: payment,
    });
  });

  // POST /api/v1/billing/payments/:id/refund
  static refundPayment = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const payment = await BillingService.refundPayment(
      id, amount, reason, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true, status: 200, message: 'Refund processed successfully', data: payment,
    });
  });

  // GET /api/v1/billing/payments
  static listPayments = AsyncHandler.handle(async (req: Request, res: Response) => {
    const query: PaymentQueryInput = req.query as any;
    const result = await BillingService.listPayments(query);

    res.status(200).json({
      success: true, status: 200, data: result.payments, pagination: result.pagination,
    });
  });

  // GET /api/v1/billing/payments/:id
  static getPayment = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = await BillingService.getPaymentById(id);

    res.status(200).json({ success: true, status: 200, data: payment });
  });

  // GET /api/v1/billing/payments/:id/invoice
  static generateInvoice = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const invoice = await BillingService.generateInvoice(id);

    res.status(200).json({ success: true, status: 200, data: invoice });
  });

  // GET /api/v1/billing/revenue
  static getRevenue = AsyncHandler.handle(async (req: Request, res: Response) => {
    const organizationId = req.query.organizationId as string;
    const stats = await BillingService.getRevenueStats(organizationId);

    res.status(200).json({ success: true, status: 200, data: stats });
  });

  // ============================================
  // SUBSCRIPTIONS
  // ============================================

  // POST /api/v1/billing/subscriptions
  static createSubscription = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateSubscriptionInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const subscription = await BillingService.createSubscription(
      dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(201).json({
      success: true, status: 201, message: 'Subscription created', data: subscription,
    });
  });

  // PATCH /api/v1/billing/subscriptions/:id
  static updateSubscription = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto: UpdateSubscriptionInput = req.body;
    const userId = req.user?.userId;
    if (!userId) throw new UnauthorizedError();

    const subscription = await BillingService.updateSubscription(
      id, dto, userId, req.ip || '', req.headers['user-agent'] || ''
    );

    res.status(200).json({
      success: true, status: 200, message: 'Subscription updated', data: subscription,
    });
  });

  // GET /api/v1/billing/subscriptions/:organizationId
  static getSubscription = AsyncHandler.handle(async (req: Request, res: Response) => {
    const { organizationId } = req.params;
    const subscription = await BillingService.getSubscription(organizationId);

    res.status(200).json({ success: true, status: 200, data: subscription });
  });
}