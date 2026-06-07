"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polygonClient = exports.PolygonClient = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
// Medical Record Anchor ABI (simplified)
const MEDICAL_RECORD_ANCHOR_ABI = [
    'function anchorHash(string memory dataHash, string memory recordType, string memory patientId) external returns (bytes32)',
    'function verifyHash(string memory dataHash) external view returns (bool, uint256, address, uint256)',
    'function getRecordByHash(string memory dataHash) external view returns (tuple(string dataHash, string recordType, string patientId, address anchoredBy, uint256 timestamp, bool exists))',
    'event HashAnchored(bytes32 indexed txId, string dataHash, string recordType, string patientId, address indexed anchoredBy, uint256 timestamp)',
];
// Contract addresses by network
const CONTRACT_ADDRESSES = {
    80002: '0x...', // Polygon Amoy (Testnet)
    137: '0x...', // Polygon Mainnet
};
class PolygonClient {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.networkId = config_1.config.nodeEnv === 'production' ? 137 : 80002;
        this.initialize();
    }
    initialize() {
        try {
            const rpcUrl = this.getRpcUrl();
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
            if (privateKey) {
                this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
            }
            const contractAddress = CONTRACT_ADDRESSES[this.networkId];
            if (contractAddress && this.signer) {
                this.contract = new ethers_1.ethers.Contract(contractAddress, MEDICAL_RECORD_ANCHOR_ABI, this.signer);
            }
            logger_1.default.info(`Polygon client initialized on network ${this.networkId}`);
        }
        catch (error) {
            logger_1.default.error('Failed to initialize Polygon client:', error);
        }
    }
    /**
     * Anchor data hash on Polygon blockchain
     */
    async anchorHash(dataHash, recordType, patientId) {
        if (!this.contract) {
            logger_1.default.warn('Blockchain contract not available - storing hash only');
            return null;
        }
        try {
            const tx = await this.contract.anchorHash(dataHash, recordType, patientId);
            const receipt = await tx.wait();
            logger_1.default.info(`Hash anchored on Polygon: ${receipt.hash}`);
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to anchor hash on Polygon:', error);
            return null;
        }
    }
    /**
     * Verify hash on blockchain
     */
    async verifyHash(dataHash) {
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
        }
        catch (error) {
            logger_1.default.error('Failed to verify hash on Polygon:', error);
            return { exists: false, anchoredBy: null, timestamp: null };
        }
    }
    /**
     * Get explorer URL for transaction
     */
    getExplorerUrl(txHash) {
        const baseUrl = this.networkId === 137
            ? 'https://polygonscan.com'
            : 'https://amoy.polygonscan.com';
        return `${baseUrl}/tx/${txHash}`;
    }
    /**
     * Get explorer URL for address
     */
    getAddressExplorerUrl(address) {
        const baseUrl = this.networkId === 137
            ? 'https://polygonscan.com'
            : 'https://amoy.polygonscan.com';
        return `${baseUrl}/address/${address}`;
    }
    /**
     * Estimate gas for anchoring
     */
    async estimateGas(dataHash, recordType, patientId) {
        if (!this.contract || !this.provider) {
            return { gasLimit: 0, gasPrice: '0', estimatedCost: '0', currency: 'MATIC' };
        }
        try {
            const gasLimit = await this.contract.anchorHash.estimateGas(dataHash, recordType, patientId);
            const feeData = await this.provider.getFeeData();
            const gasPrice = feeData.gasPrice || ethers_1.ethers.parseUnits('50', 'gwei');
            const estimatedCost = ethers_1.ethers.formatEther(gasLimit * gasPrice);
            return {
                gasLimit: Number(gasLimit),
                gasPrice: ethers_1.ethers.formatUnits(gasPrice, 'gwei'),
                estimatedCost,
                currency: 'MATIC',
            };
        }
        catch (error) {
            logger_1.default.error('Failed to estimate gas:', error);
            return { gasLimit: 0, gasPrice: '0', estimatedCost: '0', currency: 'MATIC' };
        }
    }
    /**
     * Get network name
     */
    getNetworkName() {
        return this.networkId === 137 ? 'Polygon Mainnet' : 'Polygon Amoy Testnet';
    }
    /**
     * Check if client is ready
     */
    isReady() {
        return !!(this.provider && this.contract);
    }
    getRpcUrl() {
        if (this.networkId === 137) {
            return process.env.POLYGON_MAINNET_RPC || 'https://polygon-rpc.com';
        }
        return process.env.POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology';
    }
}
exports.PolygonClient = PolygonClient;
// Singleton instance
exports.polygonClient = new PolygonClient();
//# sourceMappingURL=polygonClient.js.map