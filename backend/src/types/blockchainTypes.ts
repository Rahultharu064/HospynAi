import { BlockchainRecordType } from '@prisma/client';

// ============================================
// BLOCKCHAIN DTOs
// ============================================

export interface AnchorRecordDto {
  patientId: string;
  medicalRecordId?: string;
  recordType: BlockchainRecordType;
  data: any;
  metadata?: Record<string, any>;
}

export interface VerifyRecordDto {
  recordId?: string;
  dataHash?: string;
  txHash?: string;
}

export interface ConsentDto {
  patientId: string;
  providerId?: string;
  recordType: string;
  accessLevel: 'READ' | 'WRITE' | 'FULL';
  expiresAt?: string;
  purpose?: string;
}

export interface RevokeConsentDto {
  consentId: string;
  reason?: string;
}

export interface BlockchainQueryDto {
  page?: number;
  limit?: number;
  patientId?: string;
  medicalRecordId?: string;
  recordType?: BlockchainRecordType;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface BlockchainRecordResponse {
  id: string;
  patientId: string;
  medicalRecordId: string | null;
  recordType: BlockchainRecordType;
  dataHash: string;
  txHash: string | null;
  blockNumber: number | null;
  networkId: number | null;
  networkName: string;
  status: string;
  verifiedAt: string | null;
  metadata: Record<string, any> | null;
  explorerUrl: string | null;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
  };
  medicalRecord: {
    id: string;
    diagnosis: string | null;
  } | null;
  createdAt: string;
}

export interface BlockchainListResponse {
  records: BlockchainRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VerificationResult {
  isVerified: boolean;
  dataHash: string;
  onChainHash: string | null;
  txHash: string | null;
  blockNumber: number | null;
  timestamp: string | null;
  networkName: string;
  explorerUrl: string | null;
  message: string;
}

export interface ConsentResponse {
  id: string;
  patientId: string;
  providerId: string | null;
  recordType: string;
  accessLevel: string;
  status: string;
  expiresAt: string | null;
  purpose: string | null;
  grantedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  txHash: string | null;
  createdAt: string;
}

export interface BlockchainStats {
  totalRecords: number;
  totalVerified: number;
  totalPending: number;
  totalFailed: number;
  byRecordType: Record<string, number>;
  averageConfirmationTime: number;
  successRate: number;
  recentTransactions: RecentTransaction[];
  blockchainEnabled?: boolean;
  chainReady?: boolean;
  networkName?: string;
  networkId?: number;
}

export interface RecentTransaction {
  txHash: string;
  recordType: string;
  status: string;
  blockNumber: number | null;
  timestamp: string;
  explorerUrl: string;
}

// ============================================
// SMART CONTRACT TYPES
// ============================================

export interface SmartContractEvent {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  args: Record<string, any>;
  timestamp: string;
}

export interface GasEstimate {
  gasLimit: number;
  gasPrice: string;
  estimatedCost: string;
  currency: string;
}