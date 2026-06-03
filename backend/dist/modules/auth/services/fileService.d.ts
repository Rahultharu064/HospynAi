declare class FileServiceClass {
    private s3Client;
    constructor();
    uploadToS3(filePath: string, fileName: string, mimeType: string): Promise<string>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
    deleteFromS3(key: string): Promise<void>;
    getPublicUrl(key: string): string;
}
export declare const FileService: FileServiceClass;
export {};
//# sourceMappingURL=fileService.d.ts.map