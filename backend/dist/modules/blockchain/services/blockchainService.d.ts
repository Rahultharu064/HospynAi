import { AnchorRecordInput, VerifyRecordInput, BlockchainQueryInput, ConsentInput } from '../validators/blockchainValidators';
import { BlockchainRecordResponse, BlockchainListResponse, VerificationResult, ConsentResponse, BlockchainStats } from '../../../types/blockchainTypes';
export declare class BlockchainService {
    /**
     * ============================================
     * ANCHOR RECORD HASH
     * ============================================
     */
    static anchorRecord(data: AnchorRecordInput, userId: string, ipAddress: string, userAgent: string): Promise<BlockchainRecordResponse>;
    /**
     * ============================================
     * VERIFY RECORD
     * ============================================
     */
    static verifyRecord(data: VerifyRecordInput): Promise<VerificationResult>;
    /**
     * ============================================
     * LIST BLOCKCHAIN RECORDS
     * ============================================
     */
    static listRecords(query: BlockchainQueryInput): Promise<BlockchainListResponse>;
    /**
     * ============================================
     * GET PATIENT BLOCKCHAIN AUDIT TRAIL
     * ============================================
     */
    static getPatientAuditTrail(patientId: string): Promise<BlockchainRecordResponse[]>;
    /**
     * ============================================
     * BLOCKCHAIN STATISTICS
     * ============================================
     */
    static getStats(): Promise<BlockchainStats>;
    /**
     * ============================================
     * CONSENT MANAGEMENT
     * ============================================
     */
    static grantConsent(data: ConsentInput, userId: string): Promise<ConsentResponse>;
    /**
     * ============================================
     * REVOKE CONSENT
     * ============================================
     */
    static revokeConsent(consentId: string, reason: string | null, userId: string): Promise<ConsentResponse>;
    private static getBlockchainInclude;
    private static formatBlockchainResponse;
}
//# sourceMappingURL=blockchainService.d.ts.map