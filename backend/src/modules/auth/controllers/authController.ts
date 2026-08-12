import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';
import { FileService } from '../services/fileService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { BadRequestError, UnauthorizedError } from '../../../utils/errors';
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

    const tokens = await TokenService.rotateRefreshToken(oldRefreshToken);
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

  static googleCallback = AsyncHandler.handle(async (req: Request, res: Response) => {
    const user = req.user as any;
    const result = await AuthService.googleLogin(user, req.ip || '', req.headers['user-agent'] || '');

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth',
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback?token=${result.tokens.accessToken}`);
  });
}
