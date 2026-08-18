"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const config_1 = require("../../../config");
const authService_1 = require("../services/authService");
const tokenService_1 = require("../services/tokenService");
const fileService_1 = require("../services/fileService");
const errorMiddleware_1 = require("../../../middleware/errorMiddleware");
const errors_1 = require("../../../utils/errors");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.register(dto, req.ip || '', req.headers['user-agent'] || '');
    res.status(201).json({ success: true, status: 201, message: result.message, data: { userId: result.userId, email: result.email } });
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
AuthController.logout = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    await authService_1.AuthService.logout(req.user?.userId || '', req.sessionId || '', req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    res.status(200).json({ success: true, status: 200, message: 'Logged out successfully' });
});
AuthController.verifyOtp = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const dto = req.body;
    const result = await authService_1.AuthService.verifyOtp(dto.email, dto.code, dto.type, req.ip || '', req.headers['user-agent'] || '');
    res.status(200).json({ success: true, status: 200, message: result.message });
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
    const tokens = await tokenService_1.TokenService.rotateRefreshToken(oldRefreshToken);
    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth',
    });
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
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
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
AuthController.googleCallback = errorMiddleware_1.AsyncHandler.handle(async (req, res) => {
    const user = req.user;
    const result = await authService_1.AuthService.googleLogin(user, req.ip || '', req.headers['user-agent'] || '');
    res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/v1/auth',
    });
    res.redirect(`${config_1.config.frontendUrl}/auth/callback?token=${result.tokens.accessToken}`);
});
//# sourceMappingURL=authController.js.map