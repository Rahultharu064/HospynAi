import { ScanDocumentInput, VerifyOcrDataInput, OcrQueryInput } from '../validators/ocrValidators';
import { OcrResponse, OcrListResponse, OcrStats } from '../../../types/ocrTypes';
export declare class OcrService {
    /**
     * ============================================
     * SCAN DOCUMENT
     * ============================================
     */
    static scanDocument(file: Express.Multer.File, data: ScanDocumentInput, userId: string, ipAddress: string, userAgent: string): Promise<OcrResponse>;
    /**
     * ============================================
     * SCAN PRESCRIPTION
     * ============================================
     */
    static scanPrescription(file: Express.Multer.File, patientId: string, userId: string): Promise<OcrResponse>;
    /**
     * ============================================
     * VERIFY OCR DATA
     * ============================================
     */
    static verifyOcrData(ocrResultId: string, data: VerifyOcrDataInput, userId: string): Promise<OcrResponse>;
    /**
     * ============================================
     * LIST OCR RESULTS
     * ============================================
     */
    static listOcrResults(query: OcrQueryInput): Promise<OcrListResponse>;
    /**
     * ============================================
     * OCR STATISTICS
     * ============================================
     */
    static getOcrStats(): Promise<OcrStats>;
    private static autoFillPatientData;
}
//# sourceMappingURL=ocrService.d.ts.map