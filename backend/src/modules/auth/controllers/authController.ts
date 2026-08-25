import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { config } from '../../../config';
import { AuthService } from '../services/authService';
import { TokenService } from '../services/tokenService';
import { SessionService } from '../services/sessionService';
import { FileService } from '../services/fileService';
import { AsyncHandler } from '../../../middleware/errorMiddleware';
import { AppError, BadRequestError, NotFoundError, UnauthorizedError } from '../../../utils/errors';
import logger from '../../../utils/logger';
import {
  RegisterInput, CreateStaffInput, LoginInput, VerifyOtpInput, ForgotPasswordInput,
  ResetPasswordInput, ChangePasswordInput, UpdateProfileInput, ResendOtpInput,
} from '../validators/authValidator';

/**
 * The refresh cookie is scoped to the auth router, so it is never attached to any
 * other API call — combined with sameSite: 'strict' that's what keeps CSRF off the
 * refresh endpoint.
 */
const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/v1/auth';

/**
 * Single place that writes the refresh cookie. `maxAge` is derived from the token's
 * own absolute expiry rather than a hardcoded duration — the two used to be written
 * independently, which silently downgraded a 30-day "remember me" login to 7 days on
 * the first refresh.
 */
function setRefreshCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
    path: REFRESH_COOKIE_PATH,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}

export class AuthController {
  static register = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: RegisterInput = req.body;
    const result = await AuthService.register(dto, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: result.message, data: { userId: result.userId, email: result.email } });
  });

  /** Staff provisioning — guarded by authenticate + authorize(SUPER_ADMIN, ADMIN) on the route. */
  static createStaff = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: CreateStaffInput = req.body;
    if (!req.user?.userId) throw new UnauthorizedError();

    const actor = await AuthService.getActorContext(req.user.userId);
    const result = await AuthService.createStaff(dto, actor, req.ip || '', req.headers['user-agent'] || '');

    res.status(201).json({
      success: true, status: 201, message: result.message,
      data: { userId: result.userId, email: result.email, role: result.role },
    });
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

    setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

    res.status(200).json({
      success: true, status: 200, message: 'Login successful',
      data: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn, user: result.user },
    });
  });

  static logout = AsyncHandler.handle(async (req: Request, res: Response) => {
    await AuthService.logout(req.user?.userId || '', req.sessionId || '', req.cookies?.refreshToken);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: 'Logged out successfully' });
  });

  /** Sign out of every device — revokes all sessions and refresh tokens. */
  static logoutAll = AsyncHandler.handle(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw new UnauthorizedError();
    const result = await AuthService.logoutAll(req.user.userId);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  /** "Where you're signed in" — active sessions for the current user. */
  static listSessions = AsyncHandler.handle(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw new UnauthorizedError();
    const sessions = await SessionService.listActiveSessions(req.user.userId, req.sessionId);
    res.status(200).json({ success: true, status: 200, data: sessions });
  });

  /** Revoke a single other session. Scoped to the caller's own sessions. */
  static revokeSession = AsyncHandler.handle(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw new UnauthorizedError();
    const { sessionId } = req.params;

    const revoked = await SessionService.revokeSessionById(req.user.userId, sessionId);
    if (!revoked) throw new NotFoundError('Session not found');

    res.status(200).json({ success: true, status: 200, message: 'Session revoked' });
  });

  static verifyOtp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: VerifyOtpInput = req.body;
    const result = await AuthService.verifyOtp(dto.email, dto.code, dto.type, req.ip || '', req.headers['user-agent'] || '');

    // Email verification and 2FA complete a sign-in, so they hand back a session
    // exactly like /login does. Phone verification and password-reset codes don't.
    if ('tokens' in result && result.tokens) {
      setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

      return res.status(200).json({
        success: true, status: 200, message: result.message,
        data: { accessToken: result.tokens.accessToken, expiresIn: result.tokens.expiresIn, user: result.user },
      });
    }

    res.status(200).json({
      success: true, status: 200, message: result.message,
      data: { verified: true, isEmailVerified: result.isEmailVerified },
    });
  });

  static resendOtp = AsyncHandler.handle(async (req: Request, res: Response) => {
    const dto: ResendOtpInput = req.body;
    const result = await AuthService.resendOtp(dto.email, dto.type, dto.channel);
    res.status(200).json({ success: true, status: 200, message: result.message });
  });

  static refreshToken = AsyncHandler.handle(async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!oldRefreshToken) throw new BadRequestError('Refresh token is required');

    let tokens;
    try {
      tokens = await TokenService.rotateRefreshToken(
        oldRefreshToken,
        req.ip || '',
        req.headers['user-agent'] || ''
      );
    } catch (error) {
      // A rejected refresh token is spent — drop the cookie so the browser stops
      // replaying a credential that will never work again.
      clearRefreshCookie(res);
      throw error;
    }

    setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);

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
    clearRefreshCookie(res);
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

  static deactivateAccount = AsyncHandler.handle(async (req: Request, res: Response) => {
    if (!req.user?.userId) throw new UnauthorizedError();
    const result = await AuthService.deactivateAccount(req.user.userId, req.ip || '', req.headers['user-agent'] || '');
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: result.message });
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

        setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

        res.redirect(`${config.frontendUrl}/auth/callback?token=${result.tokens.accessToken}`);
      } catch (error) {
        logger.error('Google OAuth callback failed:', error);
        const message = error instanceof AppError ? error.message : 'Google sign-in failed. Please try again.';
        res.redirect(`${config.frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
      }
    })(req, res, next);
  };
}
