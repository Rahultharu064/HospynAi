"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = require("cloudinary");
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../../utils/logger"));
class FileServiceClass {
    constructor() {
        if (this.isConfigured()) {
            cloudinary_1.v2.config({
                cloud_name: config_1.config.upload.cloudinaryCloudName,
                api_key: config_1.config.upload.cloudinaryApiKey,
                api_secret: config_1.config.upload.cloudinaryApiSecret,
                secure: true,
            });
            logger_1.default.info('Cloudinary storage service initialized');
        }
        else {
            logger_1.default.warn('Cloudinary credentials missing — file uploads will fail until configured');
        }
    }
    isConfigured() {
        return Boolean(config_1.config.upload.cloudinaryCloudName &&
            config_1.config.upload.cloudinaryApiKey &&
            config_1.config.upload.cloudinaryApiSecret);
    }
    ensureConfigured() {
        if (!this.isConfigured()) {
            throw new Error('Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
        }
    }
    resolveResourceType(mimeType) {
        if (mimeType.startsWith('image/'))
            return 'image';
        if (mimeType.startsWith('video/') || mimeType.startsWith('audio/'))
            return 'video';
        return 'raw';
    }
    buildPublicId(fileName) {
        const cleanName = path_1.default.parse(fileName).name.replace(/[^a-zA-Z0-9-_]/g, '_');
        const uniqueSuffix = crypto_1.default.randomBytes(8).toString('hex');
        return `${cleanName}-${uniqueSuffix}`;
    }
    toUploadResult(result) {
        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    }
    /**
     * Upload from a Multer file (disk or memory storage).
     */
    async uploadMulterFile(file) {
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
    async uploadFile(filePath, fileName, mimeType) {
        this.ensureConfigured();
        try {
            const result = await cloudinary_1.v2.uploader.upload(filePath, {
                folder: config_1.config.upload.cloudinaryFolder,
                public_id: this.buildPublicId(fileName),
                resource_type: this.resolveResourceType(mimeType),
            });
            logger_1.default.info(`Uploaded '${fileName}' to Cloudinary (${result.public_id})`);
            return this.toUploadResult(result);
        }
        catch (error) {
            logger_1.default.error(`Cloudinary upload failed for '${fileName}':`, error);
            throw error;
        }
        finally {
            try {
                await promises_1.default.unlink(filePath);
            }
            catch {
                // temp file may already be removed
            }
        }
    }
    /**
     * Upload from an in-memory buffer (no temp file).
     */
    async uploadBuffer(buffer, fileName, mimeType) {
        this.ensureConfigured();
        const resourceType = this.resolveResourceType(mimeType);
        const publicId = this.buildPublicId(fileName);
        return new Promise((resolve, reject) => {
            const stream = cloudinary_1.v2.uploader.upload_stream({
                folder: config_1.config.upload.cloudinaryFolder,
                public_id: publicId,
                resource_type: resourceType,
            }, (error, result) => {
                if (error || !result) {
                    logger_1.default.error(`Cloudinary buffer upload failed for '${fileName}':`, error);
                    reject(error || new Error('Cloudinary upload returned no result'));
                    return;
                }
                logger_1.default.info(`Uploaded buffer '${fileName}' to Cloudinary (${result.public_id})`);
                resolve(this.toUploadResult(result));
            });
            stream.end(buffer);
        });
    }
    /**
     * Delete an asset by public ID or full Cloudinary URL.
     */
    async deleteFile(publicIdOrUrl) {
        this.ensureConfigured();
        const publicId = publicIdOrUrl.startsWith('http')
            ? this.extractPublicId(publicIdOrUrl)
            : publicIdOrUrl;
        if (!publicId) {
            logger_1.default.warn(`Could not resolve Cloudinary public ID for deletion: ${publicIdOrUrl}`);
            return;
        }
        try {
            const attempts = ['image', 'raw', 'video'];
            for (const resourceType of attempts) {
                const result = await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
                if (result.result === 'ok' || result.result === 'not found') {
                    logger_1.default.info(`Deleted from Cloudinary: ${publicId} (${resourceType})`);
                    return;
                }
            }
            logger_1.default.warn(`Cloudinary delete did not confirm removal for: ${publicId}`);
        }
        catch (error) {
            logger_1.default.error(`Cloudinary delete failed for ${publicId}:`, error);
            throw error;
        }
    }
    /**
     * Resolve a secure HTTPS URL from a public ID or pass through if already a URL.
     */
    getUrl(publicIdOrUrl) {
        if (publicIdOrUrl.startsWith('http'))
            return publicIdOrUrl;
        return cloudinary_1.v2.url(publicIdOrUrl, { secure: true });
    }
    extractPublicId(url) {
        try {
            if (!url)
                return null;
            const parts = url.split('/upload/');
            if (parts.length < 2)
                return null;
            let pathPart = parts[1].replace(/^v\d+\//, '');
            const lastDotIndex = pathPart.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                pathPart = pathPart.substring(0, lastDotIndex);
            }
            return pathPart;
        }
        catch (error) {
            logger_1.default.error(`Failed to extract Cloudinary public ID from URL: ${url}`, error);
            return null;
        }
    }
}
exports.FileService = new FileServiceClass();
//# sourceMappingURL=fileService.js.map