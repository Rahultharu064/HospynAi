// src/services/file.service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from '../../../config';
import logger from '../../../utils/logger';

class FileServiceClass {
  private s3Client: S3Client | null = null;

  constructor() {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: config.upload.s3Region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  async uploadToS3(
    filePath: string,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not configured');
    }

    const fileContent = await fs.readFile(filePath);
    const key = `uploads/${crypto.randomBytes(8).toString('hex')}-${fileName}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: config.upload.s3Bucket,
        Key: key,
        Body: fileContent,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      })
    );

    // Clean up local file
    await fs.unlink(filePath).catch(logger.error);

    return key;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not configured');
    }

    const command = new GetObjectCommand({
      Bucket: config.upload.s3Bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not configured');
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.upload.s3Bucket,
        Key: key,
      })
    );
  }

  getPublicUrl(key: string): string {
    return `https://${config.upload.s3Bucket}.s3.${config.upload.s3Region}.amazonaws.com/${key}`;
  }
}

export const FileService = new FileServiceClass();