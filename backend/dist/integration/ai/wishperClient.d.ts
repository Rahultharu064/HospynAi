export interface TranscriptionResult {
    text: string;
    language: string;
    confidence: number;
    duration: number;
    segments: TranscriptionSegment[];
}
export interface TranscriptionSegment {
    id: number;
    start: number;
    end: number;
    text: string;
    confidence: number;
    tokens: number[];
    temperature: number;
}
/**
 * Speech-to-text via Groq Whisper (OpenAI-compatible audio API).
 */
export declare class WhisperClient {
    private client;
    private model;
    private configured;
    constructor();
    isConfigured(): boolean;
    private ensureConfigured;
    private mimeForFormat;
    private writeTempFile;
    private transcribeFile;
    transcribe(audioPath: string, language?: string, format?: string): Promise<TranscriptionResult>;
    transcribeBase64(base64Audio: string, language?: string, format?: string): Promise<TranscriptionResult>;
    transcribeBuffer(audioBuffer: Buffer, language?: string, format?: string): Promise<TranscriptionResult>;
}
export declare const whisperClient: WhisperClient;
//# sourceMappingURL=wishperClient.d.ts.map