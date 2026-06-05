import OpenAI from 'openai';
import fs from 'fs/promises';
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

export class WhisperClient {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  /**
   * Transcribe audio file to text
   */
  async transcribe(
    audioPath: string,
    language?: string,
    format: string = 'webm'
  ): Promise<TranscriptionResult> {
    try {
      const audioFile = await fs.readFile(audioPath);

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

      const segments: TranscriptionSegment[] = (response.segments || []).map((seg: any, index: number) => ({
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

      logger.info(`Audio transcribed: "${response.text.substring(0, 100)}..."`);

      return {
        text: response.text,
        language: response.language || language || 'en',
        confidence: avgConfidence,
        duration: response.duration || 0,
        segments,
      };
    } catch (error) {
      logger.error('Whisper transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio from base64 string
   */
  async transcribeBase64(
    base64Audio: string,
    language?: string,
    format: string = 'webm'
  ): Promise<TranscriptionResult> {
    try {
      const buffer = Buffer.from(base64Audio, 'base64');
      const tempPath = `/tmp/audio_${Date.now()}.${format}`;
      await fs.writeFile(tempPath, buffer);

      const result = await this.transcribe(tempPath, language, format);
      await fs.unlink(tempPath).catch(() => {});

      return result;
    } catch (error) {
      logger.error('Base64 transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio from buffer
   */
  async transcribeBuffer(
    audioBuffer: Buffer,
    language?: string,
    format: string = 'webm'
  ): Promise<TranscriptionResult> {
    const tempPath = `/tmp/audio_${Date.now()}.${format}`;
    await fs.writeFile(tempPath, audioBuffer);
    
    const result = await this.transcribe(tempPath, language, format);
    await fs.unlink(tempPath).catch(() => {});
    
    return result;
  }
}

export const whisperClient = new WhisperClient();