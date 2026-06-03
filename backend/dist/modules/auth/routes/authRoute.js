"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../../../middleware/authMiddleware");
const uploadMiddleware_1 = require("../../../middleware/uploadMiddleware");
const validateMiddleware_1 = require("../../../middleware/validateMiddleware");
const express_rate_limit_1 = require("express-rate-limit");
const authValidator_1 = require("../validators/authValidator");
const router = (0, express_1.Router)();
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, status: 429, message: 'Too many attempts' },
});
const otpLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: { success: false, status: 429, message: 'Too many OTP attempts' },
});
// Public routes
router.post('/register', authLimiter, (0, validateMiddleware_1.validate)({ body: authValidator_1.registerSchema.shape.body }), authController_1.AuthController.register);
router.post('/login', authLimiter, (0, validateMiddleware_1.validate)({ body: authValidator_1.loginSchema.shape.body }), authController_1.AuthController.login);
router.post('/verify-otp', otpLimiter, (0, validateMiddleware_1.validate)({ body: authValidator_1.verifyOtpSchema.shape.body }), authController_1.AuthController.verifyOtp);
router.post('/resend-otp', otpLimiter, (0, validateMiddleware_1.validate)({ body: authValidator_1.resendOtpSchema.shape.body }), authController_1.AuthController.resendOtp);
router.post('/refresh', authController_1.AuthController.refreshToken);
router.post('/forgot-password', authLimiter, (0, validateMiddleware_1.validate)({ body: authValidator_1.forgotPasswordSchema.shape.body }), authController_1.AuthController.forgotPassword);
router.post('/reset-password', authLimiter, (0, validateMiddleware_1.validate)({ body: authValidator_1.resetPasswordSchema.shape.body }), authController_1.AuthController.resetPassword);
// Google OAuth
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), authController_1.AuthController.googleCallback);
// Protected routes
router.post('/logout', authMiddleware_1.authenticate, authController_1.AuthController.logout);
router.get('/me', authMiddleware_1.authenticate, authController_1.AuthController.getMe);
router.patch('/profile', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ body: authValidator_1.updateProfileSchema.shape.body }), authController_1.AuthController.updateProfile);
router.post('/change-password', authMiddleware_1.authenticate, (0, validateMiddleware_1.validate)({ body: authValidator_1.changePasswordSchema.shape.body }), authController_1.AuthController.changePassword);
router.post('/avatar', authMiddleware_1.authenticate, uploadMiddleware_1.uploadAvatar, authController_1.AuthController.uploadAvatar);
exports.default = router;
//# sourceMappingURL=authRoute.js.map