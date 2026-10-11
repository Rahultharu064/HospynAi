"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const passport_1 = __importDefault(require("passport"));
const config_1 = require("../../../config");
const authService_1 = require("../services/authService");
const tokenService_1 = require("../services/tokenService");
const sessionService_1 = require("../services/sessionService");
const fileService_1 = require("../services/fileService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
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
function setRefreshCookie(res, token, expiresAt) {
    res.cookie(REFRESH_COOKIE, token, {
        httpOnly: true,
        secure: config_1.config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
        path: REFRESH_COOKIE_PATH,
    });
}
function clearRefreshCookie(res) {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
}
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.register(dto, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: result.message, data: { userId: result.userId, email: result.email } });
});
/** Staff provisioning — guarded by authenticate + authorize(SUPER_ADMIN, ADMIN) on the route. */
AuthController.createStaff = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const actor = await authService_1.AuthService.getActorContext(req.user.userId);
    const result = await authService_1.AuthService.createStaff(dto, actor, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({
        success: true, status: 201, message: result.message,
        data: { userId: result.userId, email: result.email, role: result.role },
    });
});
AuthController.login = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.login(dto, req.ip || '', req.headers['user-agent'] || '');
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
AuthController.logout = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    await authService_1.AuthService.logout(req.user?.userId || '', req.sessionId || '', req.cookies?.refreshToken);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: 'Logged out successfully' });
});
/** Sign out of every device — revokes all sessions and refresh tokens. */
AuthController.logoutAll = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const result = await authService_1.AuthService.logoutAll(req.user.userId);
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: result.message });
});
/** "Where you're signed in" — active sessions for the current user. */
AuthController.listSessions = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const sessions = await sessionService_1.SessionService.listActiveSessions(req.user.userId, req.sessionId);
    res.status(200).json({ success: true, status: 200, data: sessions });
});
/** Revoke a single other session. Scoped to the caller's own sessions. */
AuthController.revokeSession = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const { sessionId } = req.params;
    const revoked = await sessionService_1.SessionService.revokeSessionById(req.user.userId, sessionId);
    if (!revoked)
        throw new errors_1.NotFoundError('Session not found');
    res.status(200).json({ success: true, status: 200, message: 'Session revoked' });
});
AuthController.verifyOtp = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.verifyOtp(dto.email, dto.code, dto.type, req.ip || '', req.headers['user-agent'] || '');
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
AuthController.resendOtp = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.resendOtp(dto.email, dto.type, dto.channel);
    res.status(200).json({ success: true, status: 200, message: result.message });
});
AuthController.refreshToken = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const oldRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!oldRefreshToken)
        throw new errors_1.BadRequestError('Refresh token is required');
    let tokens;
    try {
        tokens = await tokenService_1.TokenService.rotateRefreshToken(oldRefreshToken, req.ip || '', req.headers['user-agent'] || '');
    }
    catch (error) {
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
AuthController.forgotPassword = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.forgotPassword(dto.email);
    res.status(200).json({ success: true, status: 200, message: result.message });
});
AuthController.resetPassword = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.resetPassword(dto, req.ip || '', req.headers['user-agent'] || '');
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: result.message });
});
AuthController.changePassword = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const result = await authService_1.AuthService.changePassword(req.user.userId, dto, req.sessionId || '', req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: result.message });
});
AuthController.getMe = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const profile = await authService_1.AuthService.getProfile(req.user.userId);
    res.status(200).json({ success: true, status: 200, data: profile });
});
AuthController.updateProfile = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const user = await authService_1.AuthService.updateProfile(req.user.userId, dto, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: 'Profile updated', data: user });
});
AuthController.uploadAvatar = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    if (!req.file)
        throw new errors_1.BadRequestError('No file uploaded');
    const result = await authService_1.AuthService.uploadAvatar(req.user.userId, req.file, fileService_1.FileService);
    res.status(200).json({ success: true, status: 200, message: 'Avatar uploaded', data: result });
});
AuthController.deactivateAccount = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    if (!req.user?.userId)
        throw new errors_1.UnauthorizedError();
    const result = await authService_1.AuthService.deactivateAccount(req.user.userId, req.ip || '', req.headers['user-agent'] || '');
    clearRefreshCookie(res);
    res.status(200).json({ success: true, status: 200, message: result.message });
});
// This is a browser redirect flow end-to-end, so on any failure — a rejected
// Google login, or an error thrown inside AuthService.googleLogin — the user must
// land back on the frontend with an error, never on a raw JSON error response
// (which is what AsyncHandler.handle + the default error middleware would produce).
AuthController.googleCallback = (req, res, next) => {
    passport_1.default.authenticate('google', { session: false }, async (err, profile, info) => {
        if (err || !profile) {
            const message = (info && typeof info === 'object' && 'message' in info) ? info.message : 'Google sign-in failed. Please try again.';
            logger_1.default.warn(`Google OAuth authentication failed: ${message}`);
            return res.redirect(`${config_1.config.frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
        }
        try {
            const result = await authService_1.AuthService.googleLogin(profile, req.ip || '', req.headers['user-agent'] || '');
            setRefreshCookie(res, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);
            res.redirect(`${config_1.config.frontendUrl}/auth/callback?token=${result.tokens.accessToken}`);
        }
        catch (error) {
            logger_1.default.error('Google OAuth callback failed:', error);
            const message = error instanceof errors_1.AppError ? error.message : 'Google sign-in failed. Please try again.';
            res.redirect(`${config_1.config.frontendUrl}/auth/callback?error=${encodeURIComponent(message)}`);
        }
    })(req, res, next);
};
//# sourceMappingURL=authController.js.map