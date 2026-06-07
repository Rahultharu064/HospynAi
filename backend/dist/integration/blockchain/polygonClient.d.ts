export declare class PolygonClient {
    private provider;
    private signer;
    private contract;
    private networkId;
    constructor();
    private initialize;
    /**
     * Anchor data hash on Polygon blockchain
     */
    anchorHash(dataHash: string, recordType: string, patientId: string): Promise<{
        txHash: string;
        blockNumber: number;
        timestamp: string;
    } | null>;
    /**
     * Verify hash on blockchain
     */
    verifyHash(dataHash: string): Promise<{
        exists: boolean;
        anchoredBy: string | null;
        timestamp: number | null;
    }>;
    /**
     * Get explorer URL for transaction
     */
    getExplorerUrl(txHash: string): string;
    /**
     * Get explorer URL for address
     */
    getAddressExplorerUrl(address: string): string;
    /**
     * Estimate gas for anchoring
     */
    estimateGas(dataHash: string, recordType: string, patientId: string): Promise<{
        gasLimit: number;
        gasPrice: string;
        estimatedCost: string;
        currency: string;
    }>;
    /**
     * Get network name
     */
    getNetworkName(): string;
    /**
     * Check if client is ready
     */
    isReady(): boolean;
    private getRpcUrl;
}
export declare const polygonClient: PolygonClient;
//# sourceMappingURL=polygonClient.d.ts.map