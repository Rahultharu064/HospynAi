import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../../../config';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';
import { FileService } from '../services/fileService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { AppError, BadRequestError, UnauthorizedError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import {
  RegisterInput, LoginInput, VerifyOtpInput, ForgotPasswordInput,
  ResetPasswordInput, ChangePasswordInput, UpdateProfileInput, ResendOtpInput,
} from '../validators/authValidator';

export class AuthController {
  static register = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: RegisterInput = req.body;
    const result = await AuthService.register(dto, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: result.message, data: { userId: result.userId, email: result.email } });
  });

  static login = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: LoginInput = req.body;
    const result = await AuthService.login(dto, req.ip || '', req.headers['user-agent'] || '');

    if (!result.tokens) {
      return res.status(200).json({
        success: true, status: 200, message: result.message,
        data: { requiresVerification: true, userId: result.userId },
      });
    }

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: (dto.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true, status: 200, message: 'Login successful',
      data: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn, user: result.user },
    });
  });

  static logout = AsyncHandler.handle(async (req: Request, res: Response) => {
    await AuthService.logout(req.user?.userId || '', req.sessionId || '', req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ success: true, status: 200, message: 'Logged out successfully' });
  });

  static verifyOtp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: VerifyOtpInput = req.body;
    const result = await AuthService.verifyOtp(dto.email, dto.code, dto.type, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  static resendOtp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ResendOtpInput = req.body;
    const result = await AuthService.resendOtp(dto.email, dto.type, dto.channel);
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  static refreshToken = AsyncHandler.handle(async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!oldRefreshToken) throw new BadRequestError('Refresh token is required');

    const tokens = await TokenService.rotateRefreshToken(
      oldRefreshToken,
      req.ip || '',
      req.headers['user-agent'] || ''
    );
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth',
    });

    res.status(200).json({
      success: true, status: 200, message: 'Token refreshed',
      data: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn },
    });
  });

  static forgotPassword = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ForgotPasswordInput = req.body;
    const result = await AuthService.forgotPassword(dto.email);
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  static resetPassword = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ResetPasswordInput = req.body;
    const result = await AuthService.resetPassword(dto, req.ip || '', req.headers['user-agent'] || '');
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  static changePassword = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ChangePasswordInput = req.body;
    if (!req.user?.userId) throw new UnauthorizedError();
    const result = await AuthService.changePassword(req.user.userId, dto, req.sessionId || '', req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  static getMe = AsyncHandler.handle(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw new UnauthorizedError();
    const profile = await AuthService.getProfile(req.user.userId);
    res.status(200).json({ success: true, status: 200, data: profile });
  });

  static updateProfile = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: UpdateProfileInput = req.body;
    if (!req.user?.userId) throw new UnauthorizedError();
    const user = await AuthService.updateProfile(req.user.userId, dto, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Profile updated', data: user });
  });

  static uploadAvatar = AsyncHandler.handle(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw new UnauthorizedError();
    if (!req.file) throw new BadRequestError('No file uploaded');
    const result = await AuthService.uploadAvatar(req.user.userId, req.file, FileService);
    res.status(200).json({ success: true, status: 200, message: 'Avatar uploaded', data: result });
  });

  // This is a browser redirect flow end-to-end, so on any failure — a rejected
  // Google login, or an error thrown inside AuthService.googleLogin — the user must
  // land back on the frontend with an error, never on a raw JSON error response
  // (which is what AsyncHandler.handle + the default error middleware would produce).
  static googleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, async (err: unknown, profile: any, info: any) => {
      if (err || !profile) {
        const message = (info && typeof info === 'object' && 'message' in info) ? info.message : 'Google sign-in failed. Please try again.';
        logger.warn(`Google OAuth authentication failed: ${message}`);
        return res.redirect(`${config.frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
      }

      try {
        const result = await AuthService.googleLogin(profile, req.ip || '', req.headers['user-agent'] || '');

        res.cookie('refreshToken', result.tokens.refreshToken, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth',
        });

        res.redirect(`${config.frontendUrl}/auth/callback?token=${result.tokens.accessToken}`);
      } catch (error) {
        logger.error('Google OAuth callback failed:', error);
        const message = error instanceof AppError ? error.message : 'Google sign-in failed. Please try again.';
        res.redirect(`${config.frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
      }
    })(req, res, next);
  };
}