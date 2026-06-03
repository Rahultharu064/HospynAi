"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
// src/services/file.service.ts
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../../config");
const logger_1 = __importDefault(require("../../../utils/logger"));
class FileServiceClass {
    constructor() {
        this.s3Client = null;
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            this.s3Client = new client_s3_1.S3Client({
                region: config_1.config.upload.s3Region,
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                },
            });
        }
    }
    async uploadToS3(filePath, fileName, mimeType) {
        if (!this.s3Client) {
            throw new Error('S3 client not configured');
        }
        const fileContent = await promises_1.default.readFile(filePath);
        const key = `uploads/${crypto_1.default.randomBytes(8).toString('hex')}-${fileName}`;
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: config_1.config.upload.s3Bucket,
            Key: key,
            Body: fileContent,
            ContentType: mimeType,
            ServerSideEncryption: 'AES256',
        }));
        // Clean up local file
        await promises_1.default.unlink(filePath).catch(logger_1.default.error);
        return key;
    }
    async getSignedUrl(key, expiresIn = 3600) {
        if (!this.s3Client) {
            throw new Error('S3 client not configured');
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: config_1.config.upload.s3Bucket,
            Key: key,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
    }
    async deleteFromS3(key) {
        if (!this.s3Client) {
            throw new Error('S3 client not configured');
        }
        await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
            Bucket: config_1.config.upload.s3Bucket,
            Key: key,
        }));
    }
    getPublicUrl(key) {
        return `https://${config_1.config.upload.s3Bucket}.s3.${config_1.config.upload.s3Region}.amazonaws.com/${key}`;
    }
}
exports.FileService = new FileServiceClass();
//# sourceMappingURL=fileService.js.map