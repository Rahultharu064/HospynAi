export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}
declare class FileServiceClass {
    constructor();
    isConfigured(): boolean;
    private ensureConfigured;
    private resolveResourceType;
    private buildPublicId;
    private toUploadResult;
    /**
     * Upload from a Multer file (disk or memory storage).
     */
    uploadMulterFile(file: Express.Multer.File): Promise<CloudinaryUploadResult>;
    /**
     * Upload a file from disk path; deletes the temp file after upload.
     */
    uploadFile(filePath: string, fileName: string, mimeType: string): Promise<CloudinaryUploadResult>;
    /**
     * Upload from an in-memory buffer (no temp file).
     */
    uploadBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<CloudinaryUploadResult>;
    /**
     * Delete an asset by public ID or full Cloudinary URL.
     */
    deleteFile(publicIdOrUrl: string): Promise<void>;
    /**
     * Resolve a secure HTTPS URL from a public ID or pass through if already a URL.
     */
    getUrl(publicIdOrUrl: string): string;
    extractPublicId(url: string): string | null;
}
export declare const FileService: FileServiceClass;
export {};
//# sourceMappingURL=fileService.d.ts.map