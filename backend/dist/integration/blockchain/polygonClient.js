"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.polygonClient = exports.PolygonClient = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ethers_1 = require("ethers");
const config_1 = require("../../config");
const logger_1 = __importDefault(require("../../utils/logger"));
const contractAbis_1 = require("./contractAbis");
function loadDeploymentAddresses() {
    const deploymentsFile = config_1.config.blockchain.deploymentsFile;
    if (!deploymentsFile)
        return {};
    try {
        const resolved = path_1.default.isAbsolute(deploymentsFile)
            ? deploymentsFile
            : path_1.default.resolve(process.cwd(), deploymentsFile);
        if (!fs_1.default.existsSync(resolved)) {
            logger_1.default.warn(`Blockchain deployments file not found: ${resolved}`);
            return {};
        }
        const raw = JSON.parse(fs_1.default.readFileSync(resolved, 'utf-8'));
        logger_1.default.info(`Loaded blockchain deployments from ${resolved}`);
        return raw;
    }
    catch (error) {
        logger_1.default.error('Failed to load blockchain deployments file:', error);
        return {};
    }
}
function resolveAddress(envValue, deploymentValue) {
    if (envValue && envValue !== '0x...')
        return envValue;
    return deploymentValue || '';
}
class PolygonClient {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.anchorContract = null;
        this.consentContract = null;
        this.registryContract = null;
        this.networkId = config_1.config.blockchain.networkId;
        this.deployments = loadDeploymentAddresses();
        this.initialize();
    }
    initialize() {
        if (!config_1.config.blockchain.enabled) {
            logger_1.default.info('Blockchain integration disabled (BLOCKCHAIN_ENABLED != true)');
            return;
        }
        try {
            const rpcUrl = this.getRpcUrl();
            this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl, this.networkId);
            const privateKey = config_1.config.blockchain.privateKey;
            if (!privateKey) {
                logger_1.default.warn('BLOCKCHAIN_PRIVATE_KEY not set — on-chain writes disabled');
                return;
            }
            this.signer = new ethers_1.ethers.Wallet(privateKey, this.provider);
            const anchorAddress = resolveAddress(config_1.config.blockchain.contracts.medicalRecordAnchor, this.deployments.medicalRecordAnchor);
            const consentAddress = resolveAddress(config_1.config.blockchain.contracts.patientConsent, this.deployments.patientConsent);
            const registryAddress = resolveAddress(config_1.config.blockchain.contracts.medicalDataRegistry, this.deployments.medicalDataRegistry);
            if (anchorAddress) {
                this.anchorContract = new ethers_1.ethers.Contract(anchorAddress, contractAbis_1.MEDICAL_RECORD_ANCHOR_ABI, this.signer);
            }
            if (consentAddress) {
                this.consentContract = new ethers_1.ethers.Contract(consentAddress, contractAbis_1.PATIENT_CONSENT_ABI, this.signer);
            }
            if (registryAddress) {
                this.registryContract = new ethers_1.ethers.Contract(registryAddress, contractAbis_1.MEDICAL_DATA_REGISTRY_ABI, this.signer);
            }
            logger_1.default.info(`Blockchain client ready on ${this.getNetworkName()} (${this.networkId})` +
                ` — anchor: ${anchorAddress ? 'yes' : 'no'}, consent: ${consentAddress ? 'yes' : 'no'}`);
        }
        catch (error) {
            logger_1.default.error('Failed to initialize blockchain client:', error);
        }
    }
    getNetworkId() {
        return this.networkId;
    }
    getSignerAddress() {
        return this.signer?.address ?? null;
    }
    getDefaultProviderAddress() {
        return (config_1.config.blockchain.defaultProviderAddress ||
            this.signer?.address ||
            ethers_1.ethers.ZeroAddress);
    }
    isReady() {
        return !!(this.provider && this.signer && this.anchorContract);
    }
    isConsentReady() {
        return !!(this.provider && this.signer && this.consentContract);
    }
    async anchorHash(dataHash, recordType, patientPublicId) {
        if (!this.anchorContract) {
            logger_1.default.warn('MedicalRecordAnchor contract not configured');
            return null;
        }
        try {
            const tx = await this.anchorContract.anchorHash(dataHash, recordType, patientPublicId);
            const receipt = await tx.wait();
            if (!receipt)
                return null;
            logger_1.default.info(`Hash anchored on-chain: ${receipt.hash}`);
            await this.recordRegistryAudit(patientPublicId, dataHash, recordType, 'CREATE');
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to anchor hash on-chain:', error);
            throw error;
        }
    }
    async verifyHash(dataHash) {
        if (!this.anchorContract) {
            return { exists: false, anchoredBy: null, timestamp: null, isRevoked: false };
        }
        try {
            const result = await this.anchorContract.verifyHash(dataHash);
            return {
                exists: Boolean(result[0]),
                timestamp: result[1] ? Number(result[1]) : null,
                anchoredBy: result[2] || null,
                isRevoked: Boolean(result[3]),
            };
        }
        catch (error) {
            logger_1.default.error('Failed to verify hash on-chain:', error);
            return { exists: false, anchoredBy: null, timestamp: null, isRevoked: false };
        }
    }
    async grantConsent(patientPublicId, providerAddress, recordType, accessLevel, expiresAtUnix) {
        if (!this.consentContract) {
            logger_1.default.warn('PatientConsent contract not configured');
            return null;
        }
        try {
            const tx = await this.consentContract.grantConsent(patientPublicId, providerAddress, recordType, accessLevel, expiresAtUnix);
            const receipt = await tx.wait();
            if (!receipt)
                return null;
            const iface = new ethers_1.ethers.Interface(contractAbis_1.PATIENT_CONSENT_ABI);
            let onChainConsentId = '';
            for (const log of receipt.logs) {
                try {
                    const parsed = iface.parseLog(log);
                    if (parsed?.name === 'ConsentGranted') {
                        onChainConsentId = parsed.args.consentId;
                        break;
                    }
                }
                catch {
                    // not our event
                }
            }
            return { txHash: receipt.hash, onChainConsentId };
        }
        catch (error) {
            logger_1.default.error('Failed to grant consent on-chain:', error);
            throw error;
        }
    }
    async revokeConsent(onChainConsentId, reason) {
        if (!this.consentContract)
            return null;
        try {
            const tx = await this.consentContract.revokeConsent(onChainConsentId, reason);
            const receipt = await tx.wait();
            return receipt?.hash ?? null;
        }
        catch (error) {
            logger_1.default.error('Failed to revoke consent on-chain:', error);
            throw error;
        }
    }
    async estimateGas(dataHash, recordType, patientPublicId) {
        if (!this.anchorContract || !this.provider) {
            return { gasLimit: 0, gasPrice: '0', estimatedCost: '0', currency: 'MATIC' };
        }
        try {
            const gasLimit = await this.anchorContract.anchorHash.estimateGas(dataHash, recordType, patientPublicId);
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
    getExplorerUrl(txHash) {
        const baseUrl = this.networkId === 137
            ? 'https://polygonscan.com'
            : this.networkId === 80002
                ? 'https://amoy.polygonscan.com'
                : 'https://explorer.local';
        return `${baseUrl}/tx/${txHash}`;
    }
    getAddressExplorerUrl(address) {
        const baseUrl = this.networkId === 137
            ? 'https://polygonscan.com'
            : this.networkId === 80002
                ? 'https://amoy.polygonscan.com'
                : 'https://explorer.local';
        return `${baseUrl}/address/${address}`;
    }
    getNetworkName() {
        if (this.networkId === 137)
            return 'Polygon Mainnet';
        if (this.networkId === 80002)
            return 'Polygon Amoy Testnet';
        if (this.networkId === 31337)
            return 'Hardhat Local';
        return `Chain ${this.networkId}`;
    }
    async recordRegistryAudit(patientPublicId, dataHash, recordType, action) {
        if (!this.registryContract)
            return;
        try {
            const tx = await this.registryContract.recordTransaction(dataHash, recordType, action, patientPublicId, this.signer?.address ?? ethers_1.ethers.ZeroAddress, JSON.stringify({ source: 'hospyn-backend', at: new Date().toISOString() }));
            await tx.wait();
        }
        catch (error) {
            logger_1.default.warn('MedicalDataRegistry audit write failed (non-fatal):', error);
        }
    }
    getRpcUrl() {
        if (config_1.config.blockchain.rpcUrl)
            return config_1.config.blockchain.rpcUrl;
        if (this.networkId === 137)
            return config_1.config.blockchain.polygonMainnetRpc;
        if (this.networkId === 80002)
            return config_1.config.blockchain.polygonAmoyRpc;
        return 'http://127.0.0.1:8545';
    }
}
exports.PolygonClient = PolygonClient;
exports.polygonClient = new PolygonClient();
//# sourceMappingURL=polygonClient.js.map