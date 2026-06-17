import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../../../config';
import logger from '../../../utils/logger';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

class FileServiceClass {
  constructor() {
    if (this.isConfigured()) {
      cloudinary.config({
        cloud_name: config.upload.cloudinaryCloudName,
        api_key: config.upload.cloudinaryApiKey,
        api_secret: config.upload.cloudinaryApiSecret,
        secure: true,
      });
      logger.info('Cloudinary storage service initialized');
    } else {
      logger.warn('Cloudinary credentials missing — file uploads will fail until configured');
    }
  }

  isConfigured(): boolean {
    return Boolean(
      config.upload.cloudinaryCloudName &&
        config.upload.cloudinaryApiKey &&
        config.upload.cloudinaryApiSecret
    );
  }

  private ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new Error('Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
    }
  }

  private resolveResourceType(mimeType: string): 'image' | 'video' | 'raw' | 'auto' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
    return 'raw';
  }

  private buildPublicId(fileName: string): string {
    const cleanName = path.parse(fileName).name.replace(/[^a-zA-Z0-9-_]/g, '_');
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    return `${cleanName}-${uniqueSuffix}`;
  }

  private toUploadResult(result: UploadApiResponse): CloudinaryUploadResult {
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  /**
   * Upload from a Multer file (disk or memory storage).
   */
  async uploadMulterFile(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    if (file.buffer?.length) {
      return this.uploadBuffer(file.buffer, file.originalname, file.mimetype);
    }
    if (file.path) {
      return this.uploadFile(file.path, file.originalname, file.mimetype);
    }
    throw new Error('Invalid file upload: no buffer or path');
  }

  /**
   * Upload a file from disk path; deletes the temp file after upload.
   */
  async uploadFile(
    filePath: string,
    fileName: string,
    mimeType: string
  ): Promise<CloudinaryUploadResult> {
    this.ensureConfigured();

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: config.upload.cloudinaryFolder,
        public_id: this.buildPublicId(fileName),
        resource_type: this.resolveResourceType(mimeType),
      });

      logger.info(`Uploaded '${fileName}' to Cloudinary (${result.public_id})`);
      return this.toUploadResult(result);
    } catch (error) {
      logger.error(`Cloudinary upload failed for '${fileName}':`, error);
      throw error;
    } finally {
      try {
        await fs.unlink(filePath);
      } catch {
        // temp file may already be removed
      }
    }
  }

  /**
   * Upload from an in-memory buffer (no temp file).
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<CloudinaryUploadResult> {
    this.ensureConfigured();

    const resourceType = this.resolveResourceType(mimeType);
    const publicId = this.buildPublicId(fileName);

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: config.upload.cloudinaryFolder,
          public_id: publicId,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error || !result) {
            logger.error(`Cloudinary buffer upload failed for '${fileName}':`, error);
            reject(error || new Error('Cloudinary upload returned no result'));
            return;
          }
          logger.info(`Uploaded buffer '${fileName}' to Cloudinary (${result.public_id})`);
          resolve(this.toUploadResult(result));
        }
      );
      stream.end(buffer);
    });
  }

  /**
   * Delete an asset by public ID or full Cloudinary URL.
   */
  async deleteFile(publicIdOrUrl: string): Promise<void> {
    this.ensureConfigured();

    const publicId = publicIdOrUrl.startsWith('http')
      ? this.extractPublicId(publicIdOrUrl)
      : publicIdOrUrl;

    if (!publicId) {
      logger.warn(`Could not resolve Cloudinary public ID for deletion: ${publicIdOrUrl}`);
      return;
    }

    try {
      const attempts: Array<'image' | 'raw' | 'video'> = ['image', 'raw', 'video'];
      for (const resourceType of attempts) {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        if (result.result === 'ok' || result.result === 'not found') {
          logger.info(`Deleted from Cloudinary: ${publicId} (${resourceType})`);
          return;
        }
      }
      logger.warn(`Cloudinary delete did not confirm removal for: ${publicId}`);
    } catch (error) {
      logger.error(`Cloudinary delete failed for ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve a secure HTTPS URL from a public ID or pass through if already a URL.
   */
  getUrl(publicIdOrUrl: string): string {
    if (publicIdOrUrl.startsWith('http')) return publicIdOrUrl;
    return cloudinary.url(publicIdOrUrl, { secure: true });
  }

  extractPublicId(url: string): string | null {
    try {
      if (!url) return null;

      const parts = url.split('/upload/');
      if (parts.length < 2) return null;

      let pathPart = parts[1].replace(/^v\d+\//, '');
      const lastDotIndex = pathPart.lastIndexOf('.');
      if (lastDotIndex !== -1) {
        pathPart = pathPart.substring(0, lastDotIndex);
      }

      return pathPart;
    } catch (error) {
      logger.error(`Failed to extract Cloudinary public ID from URL: ${url}`, error);
      return null;
    }
  }
}

export const FileService = new FileServiceClass();
