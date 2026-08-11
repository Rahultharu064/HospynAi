export interface ChainTxResult {
    txHash: string;
    blockNumber: number;
    timestamp: string;
}
export interface DeploymentAddresses {
    medicalRecordAnchor?: string;
    patientConsent?: string;
    prescriptionVerifier?: string;
    medicalDataRegistry?: string;
}
export declare class PolygonClient {
    private provider;
    private signer;
    private anchorContract;
    private consentContract;
    private registryContract;
    private readonly networkId;
    private readonly deployments;
    constructor();
    private initialize;
    getNetworkId(): number;
    getSignerAddress(): string | null;
    getDefaultProviderAddress(): string;
    isReady(): boolean;
    isConsentReady(): boolean;
    anchorHash(dataHash: string, recordType: string, patientPublicId: string): Promise<ChainTxResult | null>;
    verifyHash(dataHash: string): Promise<{
        exists: boolean;
        anchoredBy: string | null;
        timestamp: number | null;
        isRevoked: boolean;
    }>;
    grantConsent(patientPublicId: string, providerAddress: string, recordType: string, accessLevel: string, expiresAtUnix: number): Promise<{
        txHash: string;
        onChainConsentId: string;
    } | null>;
    revokeConsent(onChainConsentId: string, reason: string): Promise<string | null>;
    estimateGas(dataHash: string, recordType: string, patientPublicId: string): Promise<{
        gasLimit: number;
        gasPrice: string;
        estimatedCost: string;
        currency: string;
    }>;
    getExplorerUrl(txHash: string): string;
    getAddressExplorerUrl(address: string): string;
    getNetworkName(): string;
    private recordRegistryAudit;
    private getRpcUrl;
}
export declare const polygonClient: PolygonClient;
//# sourceMappingURL=polygonClient.d.ts.map