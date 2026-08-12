"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
// src/services/email.service.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../../utils/logger"));
function isValidSendGridKey(key) {
    if (!key || key.length < 20)
        return false;
    if (/copied|example|your_|xxx/i.test(key))
        return false;
    return /^SG\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key);
}
function hasSmtpConfig() {
    return !!(config_1.config.email.smtp.user && config_1.config.email.smtp.password);
}
class EmailServiceClass {
    constructor() {
        this.transporter = null;
        this.useSendGrid = false;
        const preferSmtp = config_1.config.email.provider === 'smtp';
        const sendgridKey = config_1.config.email.sendgridApiKey;
        if (!preferSmtp && isValidSendGridKey(sendgridKey)) {
            mail_1.default.setApiKey(sendgridKey);
            this.useSendGrid = true;
            logger_1.default.info('Email service initialized with SendGrid API');
        }
        else if (sendgridKey && !preferSmtp) {
            logger_1.default.warn('Invalid SENDGRID_API_KEY — falling back to SMTP');
        }
        if (hasSmtpConfig()) {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.config.email.smtp.host,
                port: config_1.config.email.smtp.port,
                secure: config_1.config.email.smtp.port === 465,
                auth: {
                    user: config_1.config.email.smtp.user,
                    pass: config_1.config.email.smtp.password,
                },
            });
            if (!this.useSendGrid) {
                logger_1.default.info(`Email service initialized with SMTP (${config_1.config.email.smtp.host})`);
            }
            else {
                logger_1.default.info('SMTP transporter configured as email fallback');
            }
        }
        else if (!this.useSendGrid) {
            logger_1.default.warn('No email provider configured — OTP emails will not be delivered');
        }
    }
    async sendMail(to, subject, html, options) {
        const throwOnError = options?.throwOnError ?? false;
        if (this.useSendGrid) {
            try {
                await mail_1.default.send({
                    to,
                    from: { name: 'VoiceMed Pro', email: config_1.config.email.from },
                    subject,
                    html,
                });
                logger_1.default.info(`Email sent via SendGrid to ${to}: ${subject}`);
                return;
            }
            catch (error) {
                logger_1.default.warn(`SendGrid failed for ${to}, trying SMTP fallback:`, error);
                if (!this.transporter && throwOnError) {
                    throw error;
                }
            }
        }
        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: `"VoiceMed Pro" <${config_1.config.email.from}>`,
                    to,
                    subject,
                    html,
                });
                logger_1.default.info(`Email sent via SMTP to ${to}: ${subject}`);
                return;
            }
            catch (error) {
                logger_1.default.error(`SMTP failed for ${to}:`, error);
                if (throwOnError)
                    throw error;
                return;
            }
        }
        const err = new Error('No email provider available');
        logger_1.default.error(`Failed to send email to ${to}: ${err.message}`);
        if (throwOnError)
            throw err;
    }
    async sendOtpEmail(to, otp, type) {
        const subjectMap = {
            EMAIL_VERIFICATION: 'Verify your email address — VoiceMed Pro',
            PASSWORD_RESET: 'Reset your password — VoiceMed Pro',
            TWO_FACTOR: 'Two-factor authentication code — VoiceMed Pro',
            PHONE_VERIFICATION: 'Your verification code — VoiceMed Pro',
        };
        const subject = subjectMap[type] || 'Your verification code — VoiceMed Pro';
        const html = this.getOtpTemplate(otp, type);
        try {
            await this.sendMail(to, subject, html, { throwOnError: true });
            logger_1.default.info(`OTP email delivered to ${to} (${type})`);
        }
        catch (error) {
            if (config_1.config.nodeEnv === 'development') {
                logger_1.default.warn(`[DEV] OTP email failed for ${to}. Verification code: ${otp} (expires in ${config_1.config.otp.expiryMinutes} min)`);
            }
            throw error;
        }
    }
    async sendWelcomeEmail(to, firstName) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0A1628, #1B3A6B); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px; }
            .content p { color: #374151; font-size: 16px; line-height: 1.6; }
            .footer { background: #f9fafb; padding: 20px 40px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to VoiceMed Pro</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Welcome to VoiceMed Pro! Your account has been created successfully.</p>
              <p>Please verify your email using the OTP code we sent in a separate email.</p>
              <p>Best regards,<br>The VoiceMed Pro Team</p>
            </div>
            <div class="footer">
              <p>© 2025 VoiceMed Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendMail(to, 'Welcome to VoiceMed Pro!', html);
    }
    async sendPasswordChangeNotification(to, firstName) {
        const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0A1628, #1B3A6B); padding: 40px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 40px; }
            .content p { color: #374151; font-size: 16px; line-height: 1.6; }
            .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0; }
            .warning-box p { color: #b91c1c; margin: 0; font-size: 15px; }
            .footer { background: #f9fafb; padding: 20px 40px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed Successfully</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>This email confirms that your VoiceMed Pro password was changed successfully.</p>
              <div class="warning-box">
                <p><strong>Did you not make this change?</strong></p>
                <p>Reset your password immediately or contact support.</p>
              </div>
              <p>Best regards,<br>The VoiceMed Pro Team</p>
            </div>
            <div class="footer">
              <p>© 2025 VoiceMed Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
        await this.sendMail(to, 'VoiceMed Pro - Password Changed Successfully', html);
    }
    getOtpTemplate(otp, _type) {
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f4f6f9; }
            .container { max-width: 480px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #0D9488, #14B8A6); padding: 32px; text-align: center; }
            .header h2 { color: white; margin: 0; font-size: 20px; }
            .content { padding: 32px; text-align: center; }
            .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0D9488; background: #f0fdfa; padding: 16px 24px; border-radius: 8px; display: inline-block; margin: 24px 0; }
            .expiry { color: #6b7280; font-size: 14px; }
            .footer { background: #f9fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>VoiceMed Pro Security Code</h2>
            </div>
            <div class="content">
              <p>Your verification code is:</p>
              <div class="otp-code">${otp}</div>
              <p class="expiry">This code expires in ${config_1.config.otp.expiryMinutes} minutes.</p>
              <p style="color: #6b7280;">If you didn't request this code, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 VoiceMed Pro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    }
}
exports.EmailService = new EmailServiceClass();
//# sourceMappingURL=emailService.js.map