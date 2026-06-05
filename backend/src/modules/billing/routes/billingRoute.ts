import { Router } from 'express';
import { BillingController } from '../controllers/billingController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import {
  createPaymentSchema,
  processPaymentSchema,
  refundPaymentSchema,
  paymentIdSchema,
  paymentQuerySchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  subscriptionIdSchema,
  generateInvoiceSchema,
} from '../validators/billingValidators';

const router = Router();

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many payment requests' },
});

router.use(authenticate);

// ============================================
// PAYMENT ROUTES
// ============================================

router.post(
  '/payments',
  paymentLimiter,
  validate({ body: createPaymentSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST),
  BillingController.createPayment
);

router.post(
  '/payments/process',
  paymentLimiter,
  validate({ body: processPaymentSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST),
  BillingController.processPayment
);

router.post(
  '/payments/:id/refund',
  validate({
    params: refundPaymentSchema.shape.params,
    body: refundPaymentSchema.shape.body,
  }),
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BillingController.refundPayment
);

router.get(
  '/payments',
  validate({ query: paymentQuerySchema.shape.query }),
  authorize(
    UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST,
    UserRole.DOCTOR, UserRole.PATIENT
  ),
  BillingController.listPayments
);

router.get(
  '/payments/:id',
  validate({ params: paymentIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST,
    UserRole.DOCTOR, UserRole.PATIENT
  ),
  BillingController.getPayment
);

router.get(
  '/payments/:id/invoice',
  validate({ params: paymentIdSchema.shape.params }),
  authorize(
    UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST,
    UserRole.PATIENT
  ),
  BillingController.generateInvoice
);

// ============================================
// REVENUE ROUTES
// ============================================

router.get(
  '/revenue',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BillingController.getRevenue
);

// ============================================
// SUBSCRIPTION ROUTES
// ============================================

router.post(
  '/subscriptions',
  validate({ body: createSubscriptionSchema.shape.body }),
  authorize(UserRole.SUPER_ADMIN),
  BillingController.createSubscription
);

router.patch(
  '/subscriptions/:id',
  validate({
    params: subscriptionIdSchema.shape.params,
    body: updateSubscriptionSchema.shape.body,
  }),
  authorize(UserRole.SUPER_ADMIN),
  BillingController.updateSubscription
);

router.get(
  '/subscriptions/:organizationId',
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  BillingController.getSubscription
);

export default router;