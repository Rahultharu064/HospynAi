import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { config } from '../../config';
import logger from '../../utils/logger';
import {
  MEDICAL_RECORD_ANCHOR_ABI,
  PATIENT_CONSENT_ABI,
  MEDICAL_DATA_REGISTRY_ABI,
} from './contractAbis';

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

function loadDeploymentAddresses(): DeploymentAddresses {
  const deploymentsFile = config.blockchain.deploymentsFile;
  if (!deploymentsFile) return {};

  try {
    const resolved = path.isAbsolute(deploymentsFile)
      ? deploymentsFile
      : path.resolve(process.cwd(), deploymentsFile);

    if (!fs.existsSync(resolved)) {
      logger.warn(`Blockchain deployments file not found: ${resolved}`);
      return {};
    }

    const raw = JSON.parse(fs.readFileSync(resolved, 'utf-8')) as DeploymentAddresses;
    logger.info(`Loaded blockchain deployments from ${resolved}`);
    return raw;
  } catch (error) {
    logger.error('Failed to load blockchain deployments file:', error);
    return {};
  }
}

function resolveAddress(
  envValue: string,
  deploymentValue: string | undefined
): string {
  if (envValue && envValue !== '0x...') return envValue;
  return deploymentValue || '';
}

export class PolygonClient {
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;
  private anchorContract: ethers.Contract | null = null;
  private consentContract: ethers.Contract | null = null;
  private registryContract: ethers.Contract | null = null;
  private readonly networkId: number;
  private readonly deployments: DeploymentAddresses;

  constructor() {
    this.networkId = config.blockchain.networkId;
    this.deployments = loadDeploymentAddresses();
    this.initialize();
  }

  private initialize(): void {
    if (!config.blockchain.enabled) {
      logger.info('Blockchain integration disabled (BLOCKCHAIN_ENABLED != true)');
      return;
    }

    try {
      const rpcUrl = this.getRpcUrl();
      this.provider = new ethers.JsonRpcProvider(rpcUrl, this.networkId);

      const privateKey = config.blockchain.privateKey;
      if (!privateKey) {
        logger.warn('BLOCKCHAIN_PRIVATE_KEY not set — on-chain writes disabled');
        return;
      }

      this.signer = new ethers.Wallet(privateKey, this.provider);

      const anchorAddress = resolveAddress(
        config.blockchain.contracts.medicalRecordAnchor,
        this.deployments.medicalRecordAnchor
      );
      const consentAddress = resolveAddress(
        config.blockchain.contracts.patientConsent,
        this.deployments.patientConsent
      );
      const registryAddress = resolveAddress(
        config.blockchain.contracts.medicalDataRegistry,
        this.deployments.medicalDataRegistry
      );

      if (anchorAddress) {
        this.anchorContract = new ethers.Contract(
          anchorAddress,
          MEDICAL_RECORD_ANCHOR_ABI,
          this.signer
        );
      }

      if (consentAddress) {
        this.consentContract = new ethers.Contract(
          consentAddress,
          PATIENT_CONSENT_ABI,
          this.signer
        );
      }

      if (registryAddress) {
        this.registryContract = new ethers.Contract(
          registryAddress,
          MEDICAL_DATA_REGISTRY_ABI,
          this.signer
        );
      }

      logger.info(
        `Blockchain client ready on ${this.getNetworkName()} (${this.networkId})` +
          ` — anchor: ${anchorAddress ? 'yes' : 'no'}, consent: ${consentAddress ? 'yes' : 'no'}`
      );
    } catch (error) {
      logger.error('Failed to initialize blockchain client:', error);
    }
  }

  getNetworkId(): number {
    return this.networkId;
  }

  getSignerAddress(): string | null {
    return this.signer?.address ?? null;
  }

  getDefaultProviderAddress(): string {
    return (
      config.blockchain.defaultProviderAddress ||
      this.signer?.address ||
      ethers.ZeroAddress
    );
  }

  isReady(): boolean {
    return !!(this.provider && this.signer && this.anchorContract);
  }

  isConsentReady(): boolean {
    return !!(this.provider && this.signer && this.consentContract);
  }

  async anchorHash(
    dataHash: string,
    recordType: string,
    patientPublicId: string
  ): Promise<ChainTxResult | null> {
    if (!this.anchorContract) {
      logger.warn('MedicalRecordAnchor contract not configured');
      return null;
    }

    try {
      const tx = await this.anchorContract.anchorHash(
        dataHash,
        recordType,
        patientPublicId
      );
      const receipt = await tx.wait();
      if (!receipt) return null;

      logger.info(`Hash anchored on-chain: ${receipt.hash}`);
      await this.recordRegistryAudit(patientPublicId, dataHash, recordType, 'CREATE');

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to anchor hash on-chain:', error);
      throw error;
    }
  }

  async verifyHash(dataHash: string): Promise<{
    exists: boolean;
    anchoredBy: string | null;
    timestamp: number | null;
    isRevoked: boolean;
  }> {
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
    } catch (error) {
      logger.error('Failed to verify hash on-chain:', error);
      return { exists: false, anchoredBy: null, timestamp: null, isRevoked: false };
    }
  }

  async grantConsent(
    patientPublicId: string,
    providerAddress: string,
    recordType: string,
    accessLevel: string,
    expiresAtUnix: number
  ): Promise<{ txHash: string; onChainConsentId: string } | null> {
    if (!this.consentContract) {
      logger.warn('PatientConsent contract not configured');
      return null;
    }

    try {
      const tx = await this.consentContract.grantConsent(
        patientPublicId,
        providerAddress,
        recordType,
        accessLevel,
        expiresAtUnix
      );
      const receipt = await tx.wait();
      if (!receipt) return null;

      const iface = new ethers.Interface(PATIENT_CONSENT_ABI);
      let onChainConsentId = '';

      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'ConsentGranted') {
            onChainConsentId = parsed.args.consentId;
            break;
          }
        } catch {
          // not our event
        }
      }

      return { txHash: receipt.hash, onChainConsentId };
    } catch (error) {
      logger.error('Failed to grant consent on-chain:', error);
      throw error;
    }
  }

  async revokeConsent(onChainConsentId: string, reason: string): Promise<string | null> {
    if (!this.consentContract) return null;

    try {
      const tx = await this.consentContract.revokeConsent(onChainConsentId, reason);
      const receipt = await tx.wait();
      return receipt?.hash ?? null;
    } catch (error) {
      logger.error('Failed to revoke consent on-chain:', error);
      throw error;
    }
  }

  async estimateGas(
    dataHash: string,
    recordType: string,
    patientPublicId: string
  ): Promise<{
    gasLimit: number;
    gasPrice: string;
    estimatedCost: string;
    currency: string;
  }> {
    if (!this.anchorContract || !this.provider) {
      return { gasLimit: 0, gasPrice: '0', estimatedCost: '0', currency: 'MATIC' };
    }

    try {
      const gasLimit = await this.anchorContract.anchorHash.estimateGas(
        dataHash,
        recordType,
        patientPublicId
      );
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

  getExplorerUrl(txHash: string): string {
    const baseUrl =
      this.networkId === 137
        ? 'https://polygonscan.com'
        : this.networkId === 80002
          ? 'https://amoy.polygonscan.com'
          : 'https://explorer.local';
    return `${baseUrl}/tx/${txHash}`;
  }

  getAddressExplorerUrl(address: string): string {
    const baseUrl =
      this.networkId === 137
        ? 'https://polygonscan.com'
        : this.networkId === 80002
          ? 'https://amoy.polygonscan.com'
          : 'https://explorer.local';
    return `${baseUrl}/address/${address}`;
  }

  getNetworkName(): string {
    if (this.networkId === 137) return 'Polygon Mainnet';
    if (this.networkId === 80002) return 'Polygon Amoy Testnet';
    if (this.networkId === 31337) return 'Hardhat Local';
    return `Chain ${this.networkId}`;
  }

  private async recordRegistryAudit(
    patientPublicId: string,
    dataHash: string,
    recordType: string,
    action: string
  ): Promise<void> {
    if (!this.registryContract) return;

    try {
      const tx = await this.registryContract.recordTransaction(
        dataHash,
        recordType,
        action,
        patientPublicId,
        this.signer?.address ?? ethers.ZeroAddress,
        JSON.stringify({ source: 'hospyn-backend', at: new Date().toISOString() })
      );
      await tx.wait();
    } catch (error) {
      logger.warn('MedicalDataRegistry audit write failed (non-fatal):', error);
    }
  }

  private getRpcUrl(): string {
    if (config.blockchain.rpcUrl) return config.blockchain.rpcUrl;
    if (this.networkId === 137) return config.blockchain.polygonMainnetRpc;
    if (this.networkId === 80002) return config.blockchain.polygonAmoyRpc;
    return 'http://127.0.0.1:8545';
  }
}

export const polygonClient = new PolygonClient();
