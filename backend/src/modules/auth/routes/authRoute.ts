import { Router } from 'express';
import passport from 'passport';
import { UserRole } from '@prisma/client';
import { AuthController } from '../controllers/authController';
import { authenticate, authorize } from '../../../middleware/authMiddleware';
import { uploadAvatar } from '../../../middleware/uploadMiddleware';
import { validate } from '../../../middleware/validateMiddleware';
import { rateLimit } from 'express-rate-limit';
import {
  registerSchema, createStaffSchema, loginSchema, verifyOtpSchema, forgotPasswordSchema,
  resetPasswordSchema, changePasswordSchema, updateProfileSchema, resendOtpSchema,
} from '../validators/authValidator';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, status: 429, message: 'Too many attempts' },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { success: false, status: 429, message: 'Too many OTP attempts' },
});

// Public routes
//
// /register is PATIENT-only by construction — see registerSchema, which rejects
// role/organizationId/branchId outright. Staff accounts are created via
// POST /staff below, behind authenticate + authorize.
router.post('/register', authLimiter, validate({ body: registerSchema.shape.body }), AuthController.register);
router.post('/login', authLimiter, validate({ body: loginSchema.shape.body }), AuthController.login);
router.post('/verify-otp', otpLimiter, validate({ body: verifyOtpSchema.shape.body }), AuthController.verifyOtp);
router.post('/resend-otp', otpLimiter, validate({ body: resendOtpSchema.shape.body }), AuthController.resendOtp);
router.post('/refresh', authLimiter, AuthController.refreshToken);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema.shape.body }), AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema.shape.body }), AuthController.resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', AuthController.googleCallback);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getMe);
router.patch('/profile', authenticate, validate({ body: updateProfileSchema.shape.body }), AuthController.updateProfile);
router.post('/change-password', authenticate, validate({ body: changePasswordSchema.shape.body }), AuthController.changePassword);
router.post('/avatar', authenticate, uploadAvatar, AuthController.uploadAvatar);

// Concurrent session controls (PRD FR-AUTH: "session management with concurrent
// session controls"). Both are scoped to the caller's own sessions.
router.get('/sessions', authenticate, AuthController.listSessions);
router.delete('/sessions/:sessionId', authenticate, AuthController.revokeSession);

router.post('/deactivate', authenticate, AuthController.deactivateAccount);

// Privileged staff provisioning — the only route that honours a caller-supplied role.
router.post(
  '/staff',
  authenticate,
  authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validate({ body: createStaffSchema.shape.body }),
  AuthController.createStaff
);

export default router;
