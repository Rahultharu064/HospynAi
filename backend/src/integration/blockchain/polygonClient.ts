import { ethers } from 'ethers';
import { config } from '../../config';
import logger from '../../utils/logger';

// Medical Record Anchor ABI (simplified)
const MEDICAL_RECORD_ANCHOR_ABI = [
  'function anchorHash(string memory dataHash, string memory recordType, string memory patientId) external returns (bytes32)',
  'function verifyHash(string memory dataHash) external view returns (bool, uint256, address, uint256)',
  'function getRecordByHash(string memory dataHash) external view returns (tuple(string dataHash, string recordType, string patientId, address anchoredBy, uint256 timestamp, bool exists))',
  'event HashAnchored(bytes32 indexed txId, string dataHash, string recordType, string patientId, address indexed anchoredBy, uint256 timestamp)',
];

// Contract addresses by network
const CONTRACT_ADDRESSES: Record<number, string> = {
  80002: '0x...', // Polygon Amoy (Testnet)
  137: '0x...',   // Polygon Mainnet
};

export class PolygonClient {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  private networkId: number;

  constructor() {
    this.networkId = config.nodeEnv === 'production' ? 137 : 80002;
    this.initialize();
  }

  private initialize(): void {
    try {
      const rpcUrl = this.getRpcUrl();
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      if (privateKey) {
        this.signer = new ethers.Wallet(privateKey, this.provider);
      }

      const contractAddress = CONTRACT_ADDRESSES[this.networkId];
      if (contractAddress && this.signer) {
        this.contract = new ethers.Contract(
          contractAddress,
          MEDICAL_RECORD_ANCHOR_ABI,
          this.signer
        );
      }

      logger.info(`Polygon client initialized on network ${this.networkId}`);
    } catch (error) {
      logger.error('Failed to initialize Polygon client:', error);
    }
  }

  /**
   * Anchor data hash on Polygon blockchain
   */
  async anchorHash(
    dataHash: string,
    recordType: string,
    patientId: string
  ): Promise<{
    txHash: string;
    blockNumber: number;
    timestamp: string;
  } | null> {
    if (!this.contract) {
      logger.warn('Blockchain contract not available - storing hash only');
      return null;
    }

    try {
      const tx = await this.contract.anchorHash(dataHash, recordType, patientId);
      const receipt = await tx.wait();

      logger.info(`Hash anchored on Polygon: ${receipt.hash}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to anchor hash on Polygon:', error);
      return null;
    }
  }

  /**
   * Verify hash on blockchain
   */
  async verifyHash(dataHash: string): Promise<{
    exists: boolean;
    anchoredBy: string | null;
    timestamp: number | null;
  }> {
    if (!this.contract) {
      return { exists: false, anchoredBy: null, timestamp: null };
    }

    try {
      const result = await this.contract.verifyHash(dataHash);
      return {
        exists: result[0],
        anchoredBy: result[2],
        timestamp: result[3] ? Number(result[3]) : null,
      };
    } catch (error) {
      logger.error('Failed to verify hash on Polygon:', error);
      return { exists: false, anchoredBy: null, timestamp: null };
    }
  }

  /**
   * Get explorer URL for transaction
   */
  getExplorerUrl(txHash: string): string {
    const baseUrl = this.networkId === 137
      ? 'https://polygonscan.com'
      : 'https://amoy.polygonscan.com';
    return `${baseUrl}/tx/${txHash}`;
  }

  /**
   * Get explorer URL for address
   */
  getAddressExplorerUrl(address: string): string {
    const baseUrl = this.networkId === 137
      ? 'https://polygonscan.com'
      : 'https://amoy.polygonscan.com';
    return `${baseUrl}/address/${address}`;
  }

  /**
   * Estimate gas for anchoring
   */
  async estimateGas(dataHash: string, recordType: string, patientId: string): Promise<{
    gasLimit: number;
    gasPrice: string;
    estimatedCost: string;
    currency: string;
  }> {
    if (!this.contract || !this.provider) {
      return { gasLimit: 0, gasPrice: '0', estimatedCost: '0', currency: 'MATIC' };
    }

    try {
      const gasLimit = await this.contract.anchorHash.estimateGas(dataHash, recordType, patientId);
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei');
      const estimatedCost = ethers.formatEther(gasLimit * gasPrice);

      return {
        gasLimit: Number(gasLimit),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost,
        currency: 'MATIC',
      };
    } catch (error) {
      logger.error('Failed to estimate gas:', error);
      return { gasLimit: 0, gasPrice: '0', estimatedCost: '0', currency: 'MATIC' };
    }
  }

  /**
   * Get network name
   */
  getNetworkName(): string {
    return this.networkId === 137 ? 'Polygon Mainnet' : 'Polygon Amoy Testnet';
  }

  /**
   * Check if client is ready
   */
  isReady(): boolean {
    return !!(this.provider && this.contract);
  }

  private getRpcUrl(): string {
    if (this.networkId === 137) {
      return process.env.POLYGON_MAINNET_RPC || 'https://polygon-rpc.com';
    }
    return process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology';
  }
}

// Singleton instance
export const polygonClient = new PolygonClient();