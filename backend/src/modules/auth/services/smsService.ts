// src/services/sms.service.ts
import twilio from 'twilio';
import { config } from '../../../config';
import logger from '../../../utils/logger';

class SmsServiceClass {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
  }

  async sendSms(to: string, body: string): Promise<void> {
    if (!this.client) {
      logger.warn('Twilio not configured. SMS not sent.');
      return;
    }

    try {
      await this.client.messages.create({
        body,
        from: config.twilio.phoneNumber,
        to,
      });
      logger.info(`SMS sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send SMS to ${to}:`, error);
    }
  }

  async sendOtpSms(phone: string, otp: string): Promise<void> {
    const message = `Your VoiceMed Pro verification code is: ${otp}. It expires in ${config.otp.expiryMinutes} minutes.`;
    await this.sendSms(phone, message);
  }
}

export const SmsService = new SmsServiceClass();