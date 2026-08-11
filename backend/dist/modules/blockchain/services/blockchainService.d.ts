import { AnchorRecordInput, VerifyRecordInput, BlockchainQueryInput, ConsentInput } from '../validators/blockchainValidators';
import { BlockchainRecordResponse, BlockchainListResponse, VerificationResult, ConsentResponse, BlockchainStats } from '../../../types/blockchainTypes';
export declare class BlockchainService {
    /**
     * Submit a PENDING blockchain_records row to the chain (used after EMR sign).
     */
    static submitPendingAnchor(recordId: string): Promise<void>;
    static anchorRecord(data: AnchorRecordInput, userId: string, ipAddress: string, userAgent: string): Promise<BlockchainRecordResponse>;
    static verifyRecord(data: VerifyRecordInput): Promise<VerificationResult>;
    static listRecords(query: BlockchainQueryInput): Promise<BlockchainListResponse>;
    static getPatientAuditTrail(patientId: string): Promise<BlockchainRecordResponse[]>;
    static getStats(): Promise<BlockchainStats>;
    static grantConsent(data: ConsentInput, userId: string): Promise<ConsentResponse>;
    static revokeConsent(consentId: string, reason: string | null, userId: string): Promise<ConsentResponse>;
    private static getBlockchainInclude;
    private static formatBlockchainResponse;
    private static formatConsentResponse;
}
//# sourceMappingURL=blockchainService.d.ts.map