"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
// src/services/otp.service.ts
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../../config");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
const emailService_1 = require("./emailService");
const smsService_1 = require("./smsService");
class OtpService {
    static generateOtp() {
        return crypto_1.default
            .randomInt(0, Math.pow(10, config_1.config.otp.length))
            .toString()
            .padStart(config_1.config.otp.length, '0');
    }
    static async createAndSendOtp(userId, email, phone, type, channel) {
        // Check for existing valid OTP
        const existingOtp = await prisma_1.default.otpToken.findFirst({
            where: {
                userId,
                type,
                verifiedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (existingOtp && existingOtp.attempts >= config_1.config.otp.maxAttempts) {
            throw new errors_1.TooManyRequestsError('Too many OTP attempts. Please try again later.');
        }
        // Invalidate old OTPs of same type
        await prisma_1.default.otpToken.updateMany({
            where: {
                userId,
                type,
                verifiedAt: null,
            },
            data: {
                expiresAt: new Date(), // Immediately expire
            },
        });
        const code = this.generateOtp();
        await prisma_1.default.otpToken.create({
            data: {
                userId,
                code,
                type,
                channel,
                expiresAt: new Date(Date.now() + config_1.config.otp.expiryMinutes * 60 * 1000),
            },
        });
        // Send OTP
        if (channel === 'EMAIL') {
            await emailService_1.EmailService.sendOtpEmail(email, code, type);
        }
        else if (channel === 'SMS' && phone) {
            await smsService_1.SmsService.sendOtpSms(phone, code);
        }
    }
    static async verifyOtp(userId, code, type) {
        const otpToken = await prisma_1.default.otpToken.findFirst({
            where: {
                userId,
                type,
                verifiedAt: null,
                expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!otpToken) {
            throw new errors_1.BadRequestError('Invalid or expired OTP');
        }
        if (otpToken.attempts >= config_1.config.otp.maxAttempts) {
            throw new errors_1.TooManyRequestsError('Maximum OTP attempts exceeded');
        }
        // Increment attempts
        await prisma_1.default.otpToken.update({
            where: { id: otpToken.id },
            data: { attempts: { increment: 1 } },
        });
        if (otpToken.code !== code) {
            return false;
        }
        // Mark as verified
        await prisma_1.default.otpToken.update({
            where: { id: otpToken.id },
            data: { verifiedAt: new Date() },
        });
        return true;
    }
}
exports.OtpService = OtpService;
//# sourceMappingURL=otpServices.js.map