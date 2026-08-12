import OpenAI from 'openai';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { config } from '../../config';
import { BadRequestError } from '../../utils/errors';
import logger from '../../utils/logger';

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

const AUDIO_MIME: Record<string, string> = {
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
};

/**
 * Speech-to-text via Groq Whisper (OpenAI-compatible audio API).
 */
export class WhisperClient {
  private client: OpenAI;
  private model: string;
  private configured: boolean;

  constructor() {
    this.model = config.groq.whisperModel;
    this.configured = Boolean(config.groq.apiKey);
    this.client = new OpenAI({
      apiKey: config.groq.apiKey || 'not-configured',
      baseURL: config.groq.baseUrl,
    });

    if (!this.configured) {
      logger.warn('GROQ_API_KEY is not set — voice transcription will not work');
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new BadRequestError('Speech-to-text is not configured. Set GROQ_API_KEY in environment variables.');
    }
  }

  private mimeForFormat(format: string): string {
    return AUDIO_MIME[format] || `audio/${format}`;
  }

  private async writeTempFile(buffer: Buffer, format: string): Promise<string> {
    const tempPath = path.join(os.tmpdir(), `hospyn-audio-${Date.now()}-${Math.random().toString(36).slice(2)}.${format}`);
    await fs.writeFile(tempPath, buffer);
    return tempPath;
  }

  private async transcribeFile(
    file: File,
    language?: string
  ): Promise<TranscriptionResult> {
    this.ensureConfigured();

    const response = await this.client.audio.transcriptions.create({
      file,
      model: this.model,
      language: language || undefined,
      response_format: 'verbose_json',
      temperature: 0.2,
    });

    const segments: TranscriptionSegment[] = ((response as any).segments || []).map(
      (seg: any, index: number) => ({
        id: index,
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob ? Math.min(1, Math.exp(seg.avg_logprob)) : 0.85,
        tokens: seg.tokens || [],
        temperature: seg.temperature || 0,
      })
    );

    const avgConfidence =
      segments.length > 0
        ? segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length
        : 0.85;

    const text = response.text || '';
    logger.info(`Audio transcribed (Groq): "${text.substring(0, 100)}..."`);

    return {
      text,
      language: (response as any).language || language || 'en',
      confidence: avgConfidence,
      duration: (response as any).duration || 0,
      segments,
    };
  }

  async transcribe(
    audioPath: string,
    language?: string,
    format: string = 'webm'
  ): Promise<TranscriptionResult> {
    try {
      const audioFile = await fs.readFile(audioPath);
      const file = new File([audioFile], `audio.${format}`, {
        type: this.mimeForFormat(format),
      });
      return await this.transcribeFile(file, language);
    } catch (error) {
      logger.error('Groq Whisper transcription failed:', error);
      throw error;
    }
  }

  async transcribeBase64(
    base64Audio: string,
    language?: string,
    format: string = 'webm'
  ): Promise<TranscriptionResult> {
    const buffer = Buffer.from(base64Audio, 'base64');
    return this.transcribeBuffer(buffer, language, format);
  }

  async transcribeBuffer(
    audioBuffer: Buffer,
    language?: string,
    format: string = 'webm'
  ): Promise<TranscriptionResult> {
    let tempPath: string | null = null;
    try {
      tempPath = await this.writeTempFile(audioBuffer, format);
      return await this.transcribe(tempPath, language, format);
    } catch (error) {
      logger.error('Buffer transcription failed:', error);
      throw error;
    } finally {
      if (tempPath) {
        await fs.unlink(tempPath).catch(() => {});
      }
    }
  }
}

export const whisperClient = new WhisperClient();
