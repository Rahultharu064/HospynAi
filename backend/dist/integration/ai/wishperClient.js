"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whisperClient = exports.WhisperClient = void 0;
const openai_1 = __importDefault(require("openai"));
const promises_1 = __importDefault(require("fs/promises"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../../config");
const errors_1 = require("../../utils/errors");
const logger_1 = __importDefault(require("../../utils/logger"));
const AUDIO_MIME = {
    webm: 'audio/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
};
/**
 * Speech-to-text via Groq Whisper (OpenAI-compatible audio API).
 */
class WhisperClient {
    constructor() {
        this.model = config_1.config.groq.whisperModel;
        this.configured = Boolean(config_1.config.groq.apiKey);
        this.client = new openai_1.default({
            apiKey: config_1.config.groq.apiKey || 'not-configured',
            baseURL: config_1.config.groq.baseUrl,
        });
        if (!this.configured) {
            logger_1.default.warn('GROQ_API_KEY is not set — voice transcription will not work');
        }
    }
    isConfigured() {
        return this.configured;
    }
    ensureConfigured() {
        if (!this.configured) {
            throw new errors_1.BadRequestError('Speech-to-text is not configured. Set GROQ_API_KEY in environment variables.');
        }
    }
    mimeForFormat(format) {
        return AUDIO_MIME[format] || `audio/${format}`;
    }
    async writeTempFile(buffer, format) {
        const tempPath = path_1.default.join(os_1.default.tmpdir(), `hospyn-audio-${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`);
        await promises_1.default.writeFile(tempPath, buffer);
        return tempPath;
    }
    async transcribeFile(file, language) {
        this.ensureConfigured();
        const response = await this.client.audio.transcriptions.create({
            file,
            model: this.model,
            language: language || undefined,
            response_format: 'verbose_json',
            temperature: 0.2,
        });
        const segments = (response.segments || []).map((seg, index) => ({
            id: index,
            start: seg.start,
            end: seg.end,
            text: seg.text,
            confidence: seg.avg_logprob ? Math.min(1, Math.exp(seg.avg_logprob)) : 0.85,
            tokens: seg.tokens || [],
            temperature: seg.temperature || 0,
        }));
        const avgConfidence = segments.length > 0
            ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
            : 0.85;
        const text = response.text || '';
        logger_1.default.info(`Audio transcribed (Groq): "${text.substring(0, 100)}..."`);
        return {
            text,
            language: response.language || language || 'en',
            confidence: avgConfidence,
            duration: response.duration || 0,
            segments,
        };
    }
    async transcribe(audioPath, language, format = 'webm') {
        try {
            const audioFile = await promises_1.default.readFile(audioPath);
            const file = new File([audioFile], `audio.${format}`, {
                type: this.mimeForFormat(format),
            });
            return await this.transcribeFile(file, language);
        }
        catch (error) {
            logger_1.default.error('Groq Whisper transcription failed:', error);
            throw error;
        }
    }
    async transcribeBase64(base64Audio, language, format = 'webm') {
        const buffer = Buffer.from(base64Audio, 'base64');
        return this.transcribeBuffer(buffer, language, format);
    }
    async transcribeBuffer(audioBuffer, language, format = 'webm') {
        let tempPath = null;
        try {
            tempPath = await this.writeTempFile(audioBuffer, format);
            return await this.transcribe(tempPath, language, format);
        }
        catch (error) {
            logger_1.default.error('Buffer transcription failed:', error);
            throw error;
        }
        finally {
            if (tempPath) {
                await promises_1.default.unlink(tempPath).catch(() => { });
            }
        }
    }
}
exports.WhisperClient = WhisperClient;
exports.whisperClient = new WhisperClient();
//# sourceMappingURL=wishperClient.js.map