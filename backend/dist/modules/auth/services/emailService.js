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
class EmailServiceClass {
    constructor() {
        this.transporter = null;
        this.useSendGrid = false;
        if (config_1.config.email.sendgridApiKey) {
            mail_1.default.setApiKey(config_1.config.email.sendgridApiKey);
            this.useSendGrid = true;
            logger_1.default.info('Email service initialized with SendGrid API');
        }
        else {
            this.transporter = nodemailer_1.default.createTransport({
                host: config_1.config.email.smtp.host,
                port: config_1.config.email.smtp.port,
                secure: config_1.config.email.smtp.port === 465,
                auth: {
                    user: config_1.config.email.smtp.user,
                    pass: config_1.config.email.smtp.password,
                },
            });
            logger_1.default.info('Email service initialized with SMTP fallback');
        }
    }
    async sendMail(to, subject, html) {
        try {
            if (this.useSendGrid) {
                await mail_1.default.send({
                    to,
                    from: {
                        name: 'VoiceMed Pro',
                        email: config_1.config.email.from,
                    },
                    subject,
                    html,
                });
            }
            else if (this.transporter) {
                await this.transporter.sendMail({
                    from: `"VoiceMed Pro" <${config_1.config.email.from}>`,
                    to,
                    subject,
                    html,
                });
            }
            else {
                throw new Error('Email transporter not initialized');
            }
            logger_1.default.info(`Email sent to ${to}: ${subject}`);
        }
        catch (error) {
            logger_1.default.error(`Failed to send email to ${to}:`, error);
            // Don't throw - email failures shouldn't break the app
        }
    }
    async sendOtpEmail(to, otp, type) {
        const subjectMap = {
            EMAIL_VERIFICATION: 'Verify your email address',
            PASSWORD_RESET: 'Reset your password',
            TWO_FACTOR: 'Two-factor authentication code',
        };
        const subject = subjectMap[type] || 'Your verification code';
        const html = this.getOtpTemplate(otp, type);
        await this.sendMail(to, subject, html);
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
              <h1>Welcome to VoiceMed Pro 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${firstName},</p>
              <p>Welcome to VoiceMed Pro! We're excited to have you on board. Your account has been created successfully.</p>
              <p>With VoiceMed Pro, you can:</p>
              <ul>
                <li>Book appointments seamlessly</li>
                <li>Access your medical records securely</li>
                <li>Connect with healthcare providers</li>
                <li>Get AI-powered health assistance</li>
              </ul>
              <p>If you have any questions, feel free to reach out to our support team.</p>
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
              <p>This email is to confirm that the password for your VoiceMed Pro account has been changed successfully.</p>
              <div class="warning-box">
                <p><strong>Did you not make this change?</strong></p>
                <p>If you did not authorize this change, please reset your password immediately or contact our support team to secure your account.</p>
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
    getOtpTemplate(otp, type) {
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