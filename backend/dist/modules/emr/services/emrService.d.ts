import { CreateEMRInput, UpdateEMRInput } from '../validators/emrValidator';
import { EMRResponse, EMRListResponse, EMRStats } from '../../../types/emrTypes';
export declare class EMRService {
    /**
     * ============================================
     * CREATE EMR RECORD
     * ============================================
     */
    static createEMR(data: CreateEMRInput, userId: string, ipAddress: string, userAgent: string): Promise<EMRResponse>;
    /**
     * ============================================
     * GET EMR BY ID
     * ============================================
     */
    static getEMRById(id: string): Promise<EMRResponse>;
    /**
     * ============================================
     * GET PATIENT EMR HISTORY
     * ============================================
     */
    static getPatientEMRHistory(patientId: string, query: {
        page?: number;
        limit?: number;
    }): Promise<EMRListResponse>;
    /**
     * ============================================
     * UPDATE EMR
     * ============================================
     */
    static updateEMR(id: string, data: UpdateEMRInput, userId: string, ipAddress: string, userAgent: string): Promise<EMRResponse>;
    /**
     * ============================================
     * SIGN EMR
     * ============================================
     */
    static signEMR(id: string, userId: string, ipAddress: string, userAgent: string): Promise<EMRResponse>;
    /**
     * ============================================
     * CREATE NEW VERSION
     * ============================================
     */
    static createNewVersion(id: string, userId: string, ipAddress: string, userAgent: string): Promise<EMRResponse>;
    /**
     * ============================================
     * GENERATE PDF
     * ============================================
     */
    static generatePDF(id: string): Promise<{
        url: string;
    }>;
    /**
     * ============================================
     * EMR STATISTICS
     * ============================================
     */
    static getEMRStats(organizationId?: string): Promise<EMRStats>;
    /**
     * ============================================
     * BLOCKCHAIN ANCHORING
     * ============================================
     */
    private static createBlockchainRecord;
    private static getEMRInclude;
    private static formatEMRResponse;
}
//# sourceMappingURL=emrService.d.ts.map