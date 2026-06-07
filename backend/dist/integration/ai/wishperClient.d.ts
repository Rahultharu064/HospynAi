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
export declare class WhisperClient {
    private openai;
    constructor();
    /**
     * Transcribe audio file to text
     */
    transcribe(audioPath: string, language?: string, format?: string): Promise<TranscriptionResult>;
    /**
     * Transcribe audio from base64 string
     */
    transcribeBase64(base64Audio: string, language?: string, format?: string): Promise<TranscriptionResult>;
    /**
     * Transcribe audio from buffer
     */
    transcribeBuffer(audioBuffer: Buffer, language?: string, format?: string): Promise<TranscriptionResult>;
}
export declare const whisperClient: WhisperClient;
//# sourceMappingURL=wishperClient.d.ts.map