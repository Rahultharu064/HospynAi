// src/services/otp.service.ts
import crypto from 'crypto';
import { config } from '../../../config';
import prisma from '../../../config/prisma';
import { BadRequestError, TooManyRequestsError } from '../../../utils/errors';
import { EmailService } from './emailService';
import { SmsService } from './smsService';

export class OtpService {
  static generateOtp(): string {
    return crypto
      .randomInt(0, Math.pow(10, config.otp.length))
      .toString()
      .padStart(config.otp.length, '0');
  }

  static async createAndSendOtp(
    userId: string,
    email: string,
    phone: string | null,
    type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR',
    channel: 'EMAIL' | 'SMS'
  ): Promise<void> {
    // Check for existing valid OTP
    const existingOtp = await prisma.otpToken.findFirst({
      where: {
        userId,
        type,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOtp && existingOtp.attempts >= config.otp.maxAttempts) {
      throw new TooManyRequestsError('Too many OTP attempts. Please try again later.');
    }

    // Invalidate old OTPs of same type
    await prisma.otpToken.updateMany({
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

    await prisma.otpToken.create({
      data: {
        userId,
        code,
        type,
        channel,
        expiresAt: new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000),
      },
    });

    // Send OTP
    if (channel === 'EMAIL') {
      await EmailService.sendOtpEmail(email, code, type);
    } else if (channel === 'SMS' && phone) {
      await SmsService.sendOtpSms(phone, code);
    }
  }

  static async verifyOtp(
    userId: string,
    code: string,
    type: string
  ): Promise<boolean> {
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        userId,
        type,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpToken) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    if (otpToken.attempts >= config.otp.maxAttempts) {
      throw new TooManyRequestsError('Maximum OTP attempts exceeded');
    }

    // Increment attempts
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { attempts: { increment: 1 } },
    });

    if (otpToken.code !== code) {
      return false;
    }

    // Mark as verified
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { verifiedAt: new Date() },
    });

    return true;
  }
}