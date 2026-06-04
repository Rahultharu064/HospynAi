declare class FileServiceClass {
    constructor();
    /**
     * Uploads a file to Cloudinary and cleans up the temporary local file.
     * @param filePath Local path to the temporary file
     * @param fileName Original name of the file
     * @param mimeType MIME type of the file
     * @returns The secure HTTPS URL of the uploaded file
     */
    uploadFile(filePath: string, fileName: string, mimeType: string): Promise<string>;
    /**
     * Deletes an asset from Cloudinary using its public ID.
     * @param publicId The Cloudinary public ID of the asset
     */
    deleteFile(publicId: string): Promise<void>;
    /**
     * Helper to extract public ID from a Cloudinary URL.
     * @param url Cloudinary URL
     */
    extractPublicId(url: string): string | null;
    /**
     * =========================================================================
     * BACKWARD COMPATIBILITY ALIASES (AWS S3 Compatibility)
     * =========================================================================
     */
    /**
     * Legacy method for S3 uploading. Maps directly to Cloudinary.
     */
    uploadToS3(filePath: string, fileName: string, mimeType: string): Promise<string>;
    /**
     * Legacy method for S3 signed URLs. Cloudinary urls are secure by default,
     * so we return the secure URL.
     */
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    /**
     * Legacy method for S3 deletion. Maps to Cloudinary delete.
     */
    deleteFromS3(key: string): Promise<void>;
    /**
     * Legacy method for S3 public URL retrieval.
     */
    getPublicUrl(key: string): string;
}
export declare const FileService: FileServiceClass;
export {};
//# sourceMappingURL=fileService.d.ts.map