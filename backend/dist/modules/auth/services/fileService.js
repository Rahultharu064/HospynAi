"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
// src/modules/auth/services/fileService.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = require("cloudinary");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../../utils/logger"));
class FileServiceClass {
    constructor() {
        // Configure Cloudinary on initialization if credentials are provided
        if (config_1.config.upload.cloudinaryCloudName &&
            config_1.config.upload.cloudinaryApiKey &&
            config_1.config.upload.cloudinaryApiSecret) {
            cloudinary_1.v2.config({
                cloud_name: config_1.config.upload.cloudinaryCloudName,
                api_key: config_1.config.upload.cloudinaryApiKey,
                api_secret: config_1.config.upload.cloudinaryApiSecret,
                secure: true,
            });
            logger_1.default.info('Cloudinary storage service initialized successfully');
        }
        else {
            logger_1.default.warn('Cloudinary credentials are not fully configured in environment variables. File uploads will fail.');
        }
    }
    /**
     * Uploads a file to Cloudinary and cleans up the temporary local file.
     * @param filePath Local path to the temporary file
     * @param fileName Original name of the file
     * @param mimeType MIME type of the file
     * @returns The secure HTTPS URL of the uploaded file
     */
    async uploadFile(filePath, fileName, mimeType) {
        try {
            if (!config_1.config.upload.cloudinaryCloudName ||
                !config_1.config.upload.cloudinaryApiKey ||
                !config_1.config.upload.cloudinaryApiSecret) {
                throw new Error('Cloudinary storage service is not configured');
            }
            // Determine resource type based on MIME type
            let resourceType = 'auto';
            if (mimeType.startsWith('image/')) {
                resourceType = 'image';
            }
            else if (mimeType.startsWith('video/')) {
                resourceType = 'video';
            }
            else {
                resourceType = 'raw'; // For PDFs, word documents, etc.
            }
            // Generate a clean, unique public ID
            const cleanName = path_1.default.parse(fileName).name.replace(/[^a-zA-Z0-9-_]/g, '_');
            const uniqueSuffix = crypto_1.default.randomBytes(8).toString('hex');
            const publicId = `${cleanName}-${uniqueSuffix}`;
            // Upload to Cloudinary
            const result = await cloudinary_1.v2.uploader.upload(filePath, {
                folder: config_1.config.upload.cloudinaryFolder,
                public_id: publicId,
                resource_type: resourceType,
            });
            logger_1.default.info(`Successfully uploaded file '${fileName}' to Cloudinary folder '${config_1.config.upload.cloudinaryFolder}'. Public ID: ${result.public_id}`);
            return result.secure_url;
        }
        catch (error) {
            logger_1.default.error(`Error uploading file to Cloudinary: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
        finally {
            // Ensure the local temp file is deleted to prevent disk storage leaks
            try {
                await promises_1.default.unlink(filePath);
            }
            catch (unlinkError) {
                logger_1.default.error(`Failed to delete local temp file at ${filePath}:`, unlinkError);
            }
        }
    }
    /**
     * Deletes an asset from Cloudinary using its public ID.
     * @param publicId The Cloudinary public ID of the asset
     */
    async deleteFile(publicId) {
        try {
            if (!config_1.config.upload.cloudinaryCloudName ||
                !config_1.config.upload.cloudinaryApiKey ||
                !config_1.config.upload.cloudinaryApiSecret) {
                throw new Error('Cloudinary storage service is not configured');
            }
            // Try image destruction
            let result = await cloudinary_1.v2.uploader.destroy(publicId);
            // If result is not 'ok', try raw resource type (common for PDFs/docs)
            if (result.result !== 'ok') {
                const rawResult = await cloudinary_1.v2.uploader.destroy(publicId, {
                    resource_type: 'raw',
                });
                if (rawResult.result !== 'ok') {
                    // Also try video resource type
                    const videoResult = await cloudinary_1.v2.uploader.destroy(publicId, {
                        resource_type: 'video',
                    });
                    if (videoResult.result !== 'ok') {
                        logger_1.default.warn(`Cloudinary destroy returned status: image='${result.result}', raw='${rawResult.result}', video='${videoResult.result}' for publicId: ${publicId}`);
                        return;
                    }
                }
            }
            logger_1.default.info(`Successfully deleted file from Cloudinary. Public ID: ${publicId}`);
        }
        catch (error) {
            logger_1.default.error(`Error deleting file from Cloudinary: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    /**
     * Helper to extract public ID from a Cloudinary URL.
     * @param url Cloudinary URL
     */
    extractPublicId(url) {
        try {
            if (!url)
                return null;
            // Cloudinary URL format: https://res.cloudinary.com/<cloud_name>/<resource_type>/upload/[v<version>/]<folder>/<public_id>.<ext>
            const parts = url.split('/upload/');
            if (parts.length < 2)
                return null;
            let pathPart = parts[1];
            // Remove version (e.g., v12345678/) if present
            pathPart = pathPart.replace(/^v\d+\//, '');
            // Remove the file extension at the end
            const lastDotIndex = pathPart.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                pathPart = pathPart.substring(0, lastDotIndex);
            }
            return pathPart;
        }
        catch (error) {
            logger_1.default.error(`Failed to extract public ID from URL: ${url}`, error);
            return null;
        }
    }
    /**
     * =========================================================================
     * BACKWARD COMPATIBILITY ALIASES (AWS S3 Compatibility)
     * =========================================================================
     */
    /**
     * Legacy method for S3 uploading. Maps directly to Cloudinary.
     */
    async uploadToS3(filePath, fileName, mimeType) {
        const secureUrl = await this.uploadFile(filePath, fileName, mimeType);
        const publicId = this.extractPublicId(secureUrl);
        return publicId || secureUrl;
    }
    /**
     * Legacy method for S3 signed URLs. Cloudinary urls are secure by default,
     * so we return the secure URL.
     */
    async getSignedUrl(key, expiresIn = 3600) {
        return this.getPublicUrl(key);
    }
    /**
     * Legacy method for S3 deletion. Maps to Cloudinary delete.
     */
    async deleteFromS3(key) {
        // If a full URL is passed, extract the public ID. Otherwise, use key directly.
        const publicId = key.startsWith('http') ? this.extractPublicId(key) : key;
        await this.deleteFile(publicId || key);
    }
    /**
     * Legacy method for S3 public URL retrieval.
     */
    getPublicUrl(key) {
        if (key.startsWith('http'))
            return key;
        // Generate URL using cloudinary SDK
        return cloudinary_1.v2.url(key, { secure: true });
    }
}
exports.FileService = new FileServiceClass();
//# sourceMappingURL=fileService.js.map