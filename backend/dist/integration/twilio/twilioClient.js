"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioClient = exports.TwilioClient = void 0;
const twilio_1 = __importDefault(require("twilio"));
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
class TwilioClient {
    constructor() {
        this.client = (0, twilio_1.default)(config_1.config.twilio.accountSid, config_1.config.twilio.authToken);
        this.twiml = twilio_1.default.twiml;
    }
    /**
     * Initiate outbound call
     */
    async makeCall(to, from, twimlUrl, statusCallback) {
        try {
            const call = await this.client.calls.create({
                to,
                from: from || config_1.config.twilio.phoneNumber,
                twiml: twimlUrl ? undefined : this.generateGreetingTwiML(),
                url: twimlUrl || undefined,
                statusCallback: statusCallback || `${process.env.API_URL}/api/v1/calling/webhook/status`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                statusCallbackMethod: 'POST',
                machineDetection: 'Enable',
                machineDetectionTimeout: 5,
            });
            logger_1.default.info(`Outbound call initiated: ${call.sid} to ${to}`);
            return { callSid: call.sid, status: call.status };
        }
        catch (error) {
            logger_1.default.error('Failed to initiate call:', error);
            throw error;
        }
    }
    /**
     * Generate greeting TwiML for outbound calls
     */
    generateGreetingTwiML(message) {
        const response = new this.twiml.VoiceResponse();
        const gather = response.gather({
            input: ['speech'],
            timeout: 5,
            speechTimeout: 'auto',
            language: 'en-US',
            action: `${process.env.API_URL}/api/v1/calling/webhook/voice`,
            method: 'POST',
        });
        gather.say({
            voice: 'Polly.Joanna',
            language: 'en-US',
        }, message || 'Hello, this is VoiceMed Pro calling. How can I help you today?');
        // If no input, redirect to fallback
        response.redirect({
            method: 'POST',
        }, `${process.env.API_URL}/api/v1/calling/webhook/voice?fallback=true`);
        return response.toString();
    }
    /**
     * Generate TwiML for incoming call handling
     */
    generateIncomingTwiML() {
        const response = new this.twiml.VoiceResponse();
        const gather = response.gather({
            input: ['speech', 'dtmf'],
            timeout: 5,
            speechTimeout: 'auto',
            language: 'en-US',
            numDigits: 1,
            action: `${process.env.API_URL}/api/v1/calling/webhook/voice`,
            method: 'POST',
        });
        gather.say({
            voice: 'Polly.Joanna',
            language: 'en-US',
        }, 'Thank you for calling VoiceMed Pro. ' +
            'You can say things like "I want to book an appointment" or "Check my test results". ' +
            'How can I assist you today?');
        response.redirect({
            method: 'POST',
        }, `${process.env.API_URL}/api/v1/calling/webhook/voice?fallback=true`);
        return response.toString();
    }
    /**
     * Generate AI response TwiML
     */
    generateResponseTwiML(message, gatherAfter = true) {
        const response = new this.twiml.VoiceResponse();
        response.say({
            voice: 'Polly.Joanna',
            language: 'en-US',
        }, message);
        if (gatherAfter) {
            const gather = response.gather({
                input: ['speech'],
                timeout: 5,
                speechTimeout: 'auto',
                action: `${process.env.API_URL}/api/v1/calling/webhook/voice`,
                method: 'POST',
            });
            gather.say({ voice: 'Polly.Joanna' }, 'Is there anything else I can help you with?');
        }
        return response.toString();
    }
    /**
     * Generate transfer to human TwiML
     */
    generateTransferTwiML(transferTo, message) {
        const response = new this.twiml.VoiceResponse();
        if (message) {
            response.say({ voice: 'Polly.Joanna' }, message);
        }
        response.say({ voice: 'Polly.Joanna' }, 'Please hold while I transfer you to a human agent.');
        response.dial({
            timeout: 30,
            action: `${process.env.API_URL}/api/v1/calling/webhook/status`,
            method: 'POST',
        }, transferTo);
        return response.toString();
    }
    /**
     * Generate voicemail TwiML
     */
    generateVoicemailTwiML() {
        const response = new this.twiml.VoiceResponse();
        response.say({ voice: 'Polly.Joanna' }, 'We are unable to take your call at the moment. Please leave a message after the beep, and we will get back to you as soon as possible.');
        response.record({
            maxLength: 120,
            action: `${process.env.API_URL}/api/v1/calling/webhook/voicemail`,
            method: 'POST',
            transcribe: true,
            transcribeCallback: `${process.env.API_URL}/api/v1/calling/webhook/transcription`,
        });
        return response.toString();
    }
    /**
     * Generate end call TwiML
     */
    generateEndCallTwiML(message) {
        const response = new this.twiml.VoiceResponse();
        if (message) {
            response.say({ voice: 'Polly.Joanna' }, message);
        }
        response.say({ voice: 'Polly.Joanna' }, 'Thank you for calling VoiceMed Pro. Goodbye!');
        response.hangup();
        return response.toString();
    }
    /**
     * Get call details
     */
    async getCall(callSid) {
        try {
            const call = await this.client.calls(callSid).fetch();
            return call;
        }
        catch (error) {
            logger_1.default.error('Failed to get call details:', error);
            return null;
        }
    }
    /**
     * Update call
     */
    async updateCall(callSid, twiml) {
        try {
            await this.client.calls(callSid).update({ twiml });
            logger_1.default.info(`Call ${callSid} updated`);
        }
        catch (error) {
            logger_1.default.error('Failed to update call:', error);
        }
    }
    /**
     * Hang up call
     */
    async hangUpCall(callSid) {
        try {
            await this.client.calls(callSid).update({ status: 'completed' });
            logger_1.default.info(`Call ${callSid} hung up`);
        }
        catch (error) {
            logger_1.default.error('Failed to hang up call:', error);
        }
    }
    /**
     * Get active calls
     */
    async getActiveCalls() {
        try {
            const calls = await this.client.calls.list({
                status: 'in-progress',
                limit: 20,
            });
            return calls;
        }
        catch (error) {
            logger_1.default.error('Failed to get active calls:', error);
            return [];
        }
    }
}
exports.TwilioClient = TwilioClient;
exports.twilioClient = new TwilioClient();
//# sourceMappingURL=twilioClient.js.map