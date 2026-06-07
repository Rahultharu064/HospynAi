"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whisperClient = exports.WhisperClient = void 0;
const openai_1 = __importDefault(require("openai"));
const promises_1 = __importDefault(require("fs/promises"));
const logger_1 = __importDefault(require("../../utils/logger"));
class WhisperClient {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY || '',
        });
    }
    /**
     * Transcribe audio file to text
     */
    async transcribe(audioPath, language, format = 'webm') {
        try {
            const audioFile = await promises_1.default.readFile(audioPath);
            const file = new File([audioFile], `audio.${format}`, {
                type: `audio/${format}`,
            });
            const response = await this.openai.audio.transcriptions.create({
                file,
                model: 'whisper-1',
                language: language || undefined,
                response_format: 'verbose_json',
                timestamp_granularities: ['segment'],
                temperature: 0.2,
            });
            const segments = (response.segments || []).map((seg, index) => ({
                id: index,
                start: seg.start,
                end: seg.end,
                text: seg.text,
                confidence: seg.confidence || 0,
                tokens: seg.tokens || [],
                temperature: seg.temperature || 0,
            }));
            const avgConfidence = segments.length > 0
                ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
                : 0.8;
            logger_1.default.info(`Audio transcribed: "${response.text.substring(0, 100)}..."`);
            return {
                text: response.text,
                language: response.language || language || 'en',
                confidence: avgConfidence,
                duration: response.duration || 0,
                segments,
            };
        }
        catch (error) {
            logger_1.default.error('Whisper transcription failed:', error);
            throw error;
        }
    }
    /**
     * Transcribe audio from base64 string
     */
    async transcribeBase64(base64Audio, language, format = 'webm') {
        try {
            const buffer = Buffer.from(base64Audio, 'base64');
            const tempPath = `/tmp/audio_${Date.now()}.${format}`;
            await promises_1.default.writeFile(tempPath, buffer);
            const result = await this.transcribe(tempPath, language, format);
            await promises_1.default.unlink(tempPath).catch(() => { });
            return result;
        }
        catch (error) {
            logger_1.default.error('Base64 transcription failed:', error);
            throw error;
        }
    }
    /**
     * Transcribe audio from buffer
     */
    async transcribeBuffer(audioBuffer, language, format = 'webm') {
        const tempPath = `/tmp/audio_${Date.now()}.${format}`;
        await promises_1.default.writeFile(tempPath, audioBuffer);
        const result = await this.transcribe(tempPath, language, format);
        await promises_1.default.unlink(tempPath).catch(() => { });
        return result;
    }
}
exports.WhisperClient = WhisperClient;
exports.whisperClient = new WhisperClient();
//# sourceMappingURL=wishperClient.js.map