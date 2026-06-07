export declare class OpenCVClient {
    /**
     * Preprocess image for better OCR accuracy
     */
    preprocessImage(imagePath: string): Promise<string>;
    /**
     * Deskew image (correct rotation)
     */
    deskewImage(imagePath: string): Promise<string>;
    /**
     * Remove noise and enhance quality
     */
    enhanceImage(imagePath: string): Promise<string>;
    /**
     * Crop to document area
     */
    cropToDocument(imagePath: string): Promise<string>;
    /**
     * Full preprocessing pipeline
     */
    fullPreprocess(imagePath: string): Promise<string>;
}
export declare const opencvClient: OpenCVClient;
//# sourceMappingURL=opencvClient.d.ts.map