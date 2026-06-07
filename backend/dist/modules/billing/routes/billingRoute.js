"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billingController_1 = require("../controllers/billingController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const client_1 = require("@prisma/client");
const billingValidators_1 = require("../validators/billingValidators");
const router = (0, express_1.Router)();
const paymentLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 30,
    message: { success: false, message: 'Too many payment requests' },
});
router.use(authMiddleware_1.authenticate);
// ============================================
// PAYMENT ROUTES
// ============================================
router.post('/payments', paymentLimiter, (0, validateMiddleware_1.validate)({ body: billingValidators_1.createPaymentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), billingController_1.BillingController.createPayment);
router.post('/payments/process', paymentLimiter, (0, validateMiddleware_1.validate)({ body: billingValidators_1.processPaymentSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST), billingController_1.BillingController.processPayment);
router.post('/payments/:id/refund', (0, validateMiddleware_1.validate)({
    params: billingValidators_1.refundPaymentSchema.shape.params,
    body: billingValidators_1.refundPaymentSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), billingController_1.BillingController.refundPayment);
router.get('/payments', (0, validateMiddleware_1.validate)({ query: billingValidators_1.paymentQuerySchema.shape.query }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), billingController_1.BillingController.listPayments);
router.get('/payments/:id', (0, validateMiddleware_1.validate)({ params: billingValidators_1.paymentIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.DOCTOR, client_1.UserRole.PATIENT), billingController_1.BillingController.getPayment);
router.get('/payments/:id/invoice', (0, validateMiddleware_1.validate)({ params: billingValidators_1.paymentIdSchema.shape.params }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.RECEPTIONIST, client_1.UserRole.PATIENT), billingController_1.BillingController.generateInvoice);
// ============================================
// REVENUE ROUTES
// ============================================
router.get('/revenue', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), billingController_1.BillingController.getRevenue);
// ============================================
// SUBSCRIPTION ROUTES
// ============================================
router.post('/subscriptions', (0, validateMiddleware_1.validate)({ body: billingValidators_1.createSubscriptionSchema.shape.body }), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN), billingController_1.BillingController.createSubscription);
router.patch('/subscriptions/:id', (0, validateMiddleware_1.validate)({
    params: billingValidators_1.subscriptionIdSchema.shape.params,
    body: billingValidators_1.updateSubscriptionSchema.shape.body,
}), (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN), billingController_1.BillingController.updateSubscription);
router.get('/subscriptions/:organizationId', (0, authMiddleware_1.authorize)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN), billingController_1.BillingController.getSubscription);
exports.default = router;
//# sourceMappingURL=billingRoute.js.map