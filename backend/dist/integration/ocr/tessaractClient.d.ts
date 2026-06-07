import Tesseract from 'tesseract.js';
import { ExtractedData } from '../../types/ocrTypes';
export declare class TesseractClient {
    private worker;
    /**
     * Initialize Tesseract worker
     */
    initialize(language?: string): Promise<void>;
    /**
     * Extract text from image
     */
    extractText(imagePath: string): Promise<{
        text: string;
        confidence: number;
        words: Tesseract.Word[];
    }>;
    /**
     * Extract structured data from OCR text based on document type
     */
    extractStructuredData(text: string, documentType: string, confidence: number): ExtractedData;
    /**
     * Extract patient information from text
     */
    private extractPatientInfo;
    /**
     * Extract prescription data
     */
    private extractPrescriptionData;
    /**
     * Extract lab results
     */
    private extractLabResults;
    /**
     * Extract insurance information
     */
    private extractInsuranceInfo;
    /**
     * Extract doctor information
     */
    private extractDoctorInfo;
    /**
     * Extract value using regex pattern
     */
    private extractPattern;
    /**
     * Guess name from text
     */
    private guessName;
    /**
     * Normalize gender value
     */
    private normalizeGender;
    /**
     * Terminate worker
     */
    terminate(): Promise<void>;
}
export declare const tesseractClient: TesseractClient;
//# sourceMappingURL=tessaractClient.d.ts.map