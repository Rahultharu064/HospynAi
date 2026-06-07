"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const billingService_1 = require("../services/billingService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class BillingController {
}
exports.BillingController = BillingController;
_a = BillingController;
// ============================================
// PAYMENTS
// ============================================
// POST /api/v1/billing/payments
BillingController.createPayment = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const payment = await billingService_1.BillingService.createPayment(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true, status: 201, message: 'Payment created successfully', data: payment,
    });
});
// POST /api/v1/billing/payments/process
BillingController.processPayment = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const payment = await billingService_1.BillingService.processPayment(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true, status: 200, message: 'Payment processed successfully', data: payment,
    });
});
// POST /api/v1/billing/payments/:id/refund
BillingController.refundPayment = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const payment = await billingService_1.BillingService.refundPayment(id, amount, reason, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true, status: 200, message: 'Refund processed successfully', data: payment,
    });
});
// GET /api/v1/billing/payments
BillingController.listPayments = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const query = req.query;
    const result = await billingService_1.BillingService.listPayments(query);
    res.status(200).json({
        success: true, status: 200, data: result.payments, pagination: result.pagination,
    });
});
// GET /api/v1/billing/payments/:id
BillingController.getPayment = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const payment = await billingService_1.BillingService.getPaymentById(id);
    res.status(200).json({ success: true, status: 200, data: payment });
});
// GET /api/v1/billing/payments/:id/invoice
BillingController.generateInvoice = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const invoice = await billingService_1.BillingService.generateInvoice(id);
    res.status(200).json({ success: true, status: 200, data: invoice });
});
// GET /api/v1/billing/revenue
BillingController.getRevenue = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const organizationId = req.query.organizationId;
    const stats = await billingService_1.BillingService.getRevenueStats(organizationId);
    res.status(200).json({ success: true, status: 200, data: stats });
});
// ============================================
// SUBSCRIPTIONS
// ============================================
// POST /api/v1/billing/subscriptions
BillingController.createSubscription = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const subscription = await billingService_1.BillingService.createSubscription(dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true, status: 201, message: 'Subscription created', data: subscription,
    });
});
// PATCH /api/v1/billing/subscriptions/:id
BillingController.updateSubscription = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { id } = req.params;
    const dto = req.body;
    const userId = req.user?.userId;
    if (!userId)
        throw new errors_1.UnauthorizedError();
    const subscription = await billingService_1.BillingService.updateSubscription(id, dto, userId, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({
        success: true, status: 200, message: 'Subscription updated', data: subscription,
    });
});
// GET /api/v1/billing/subscriptions/:organizationId
BillingController.getSubscription = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const { organizationId } = req.params;
    const subscription = await billingService_1.BillingService.getSubscription(organizationId);
    res.status(200).json({ success: true, status: 200, data: subscription });
});
//# sourceMappingURL=billingController.js.map