"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
// src/services/sms.service.ts
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../../utils/logger"));
class SmsServiceClass {
    constructor() {
        this.client = null;
        if (config_1.config.twilio.accountSid && config_1.config.twilio.authToken) {
            this.client = (0, twilio_1.default)(config_1.config.twilio.accountSid, config_1.config.twilio.authToken);
        }
    }
    async sendSms(to, body) {
        if (!this.client) {
            logger_1.default.warn('Twilio not configured. SMS not sent.');
            return false;
        }
        try {
            await this.client.messages.create({
                body,
                from: config_1.config.twilio.phoneNumber,
                to,
            });
            logger_1.default.info(`SMS sent to ${to}`);
            return true;
        }
        catch (error) {
            logger_1.default.error(`Failed to send SMS to ${to}:`, error);
            return false;
        }
    }
    async sendOtpSms(phone, otp) {
        const message = `Your VoiceMed Pro verification code is: ${otp}. It expires in ${config_1.config.otp.expiryMinutes} minutes.`;
        await this.sendSms(phone, message);
    }
}
exports.SmsService = new SmsServiceClass();
//# sourceMappingURL=smsService.js.map