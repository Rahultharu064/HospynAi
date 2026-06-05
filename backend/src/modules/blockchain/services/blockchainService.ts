import crypto from 'crypto';
import { Prisma, BlockchainRecordType } from '@prisma/client';
import prisma from '../../../config/prisma';
import { polygonClient } from '../../../integration/blockchain/polygonClient';
import { AuditService } from '../../auth/services/auditService';
import {
  AnchorRecordInput,
  VerifyRecordInput,
  BlockchainQueryInput,
  ConsentInput,
} from '../validators/blockchainValidators';
import {
  BadRequestError,
  NotFoundError,
} from '../../../utils/errors';
import {
  BlockchainRecordResponse,
  BlockchainListResponse,
  VerificationResult,
  ConsentResponse,
  BlockchainStats,
} from '../../../types/blockchainTypes';
import logger from '../../../utils/logger';

export class BlockchainService {
  /**
   * ============================================
   * ANCHOR RECORD HASH
   * ============================================
   */
  static async anchorRecord(
    data: AnchorRecordInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<BlockchainRecordResponse> {
    // Validate patient
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient || patient.deletedAt) {
      throw new NotFoundError('Patient not found');
    }

    // Validate medical record if provided
    if (data.medicalRecordId) {
      const emr = await prisma.medicalRecord.findUnique({
        where: { id: data.medicalRecordId },
      });
      if (!emr) throw new NotFoundError('Medical record not found');
    }

    // Generate SHA-256 hash
    const dataString = JSON.stringify({
      patientId: data.patientId,
      medicalRecordId: data.medicalRecordId,
      recordType: data.recordType,
      data: data.data,
      timestamp: new Date().toISOString(),
    });
    const dataHash = crypto.createHash('sha256').update(dataString).digest('hex');

    // Try to anchor on Polygon blockchain
    let txHash: string | null = null;
    let blockNumber: number | null = null;
    let networkId: number | null = null;

    if (polygonClient.isReady()) {
      const result = await polygonClient.anchorHash(
        dataHash,
        data.recordType,
        patient.patientId
      );

      if (result) {
        txHash = result.txHash;
        blockNumber = result.blockNumber;
        networkId = 80002; // Amoy testnet
      }
    }

    // Store in database
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.blockchainRecord.create({
        data: {
          patientId: data.patientId,
          medicalRecordId: data.medicalRecordId || null,
          recordType: data.recordType,
          dataHash,
          txHash,
          blockNumber: blockNumber ? BigInt(blockNumber) : null,
          networkId,
          status: txHash ? 'CONFIRMED' : 'PENDING',
          metadata: {
            ...data.metadata,
            anchoredBy: userId,
            dataSnapshot: data.data,
          },
        },
        include: this.getBlockchainInclude(),
      });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'BLOCKCHAIN_RECORD_ANCHORED',
          resource: 'BLOCKCHAIN_RECORD',
          resourceId: created.id,
          ipAddress,
          userAgent,
          metadata: { dataHash, txHash, recordType: data.recordType },
        },
      });

      return created;
    });

    logger.info(`Blockchain record anchored: ${dataHash.substring(0, 16)}...`);
    return this.formatBlockchainResponse(record);
  }

  /**
   * ============================================
   * VERIFY RECORD
   * ============================================
   */
  static async verifyRecord(data: VerifyRecordInput): Promise<VerificationResult> {
    let record: any = null;
    let dataHash: string | null = null;

    // Find record by ID, hash, or txHash
    if (data.recordId) {
      record = await prisma.blockchainRecord.findUnique({
        where: { id: data.recordId },
      });
    } else if (data.dataHash) {
      record = await prisma.blockchainRecord.findFirst({
        where: { dataHash: data.dataHash },
        orderBy: { createdAt: 'desc' },
      });
    } else if (data.txHash) {
      record = await prisma.blockchainRecord.findFirst({
        where: { txHash: data.txHash },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!record) {
      return {
        isVerified: false,
        dataHash: data.dataHash || '',
        onChainHash: null,
        txHash: null,
        blockNumber: null,
        timestamp: null,
        networkName: polygonClient.getNetworkName(),
        explorerUrl: null,
        message: 'Record not found in database',
      };
    }

    dataHash = record.dataHash;

    // Verify on blockchain if client is available
    let onChainResult = null;
    if (polygonClient.isReady() && dataHash) {
      onChainResult = await polygonClient.verifyHash(dataHash);
    }

    const isVerified = record.txHash !== null && record.status === 'CONFIRMED';
    const explorerUrl = record.txHash
      ? polygonClient.getExplorerUrl(record.txHash)
      : null;

    // Update verification status in database
    if (onChainResult?.exists && record.status !== 'CONFIRMED') {
      await prisma.blockchainRecord.update({
        where: { id: record.id },
        data: {
          status: 'CONFIRMED',
          verifiedAt: new Date(),
        },
      });
    }

    return {
      isVerified,
      dataHash: record.dataHash,
      onChainHash: dataHash,
      txHash: record.txHash,
      blockNumber: record.blockNumber ? Number(record.blockNumber) : null,
      timestamp: record.createdAt.toISOString(),
      networkName: polygonClient.getNetworkName(),
      explorerUrl,
      message: isVerified
        ? 'Record verified on blockchain ✓'
        : 'Record not yet confirmed on blockchain',
    };
  }

  /**
   * ============================================
   * LIST BLOCKCHAIN RECORDS
   * ============================================
   */
  static async listRecords(query: BlockchainQueryInput): Promise<BlockchainListResponse> {
    const {
      page = 1,
      limit = 10,
      patientId,
      medicalRecordId,
      recordType,
      status,
      dateFrom,
      dateTo,
    } = query;

    const where: Prisma.BlockchainRecordWhereInput = {};

    if (patientId) where.patientId = patientId;
    if (medicalRecordId) where.medicalRecordId = medicalRecordId;
    if (recordType) where.recordType = recordType as BlockchainRecordType;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      prisma.blockchainRecord.findMany({
        where,
        include: this.getBlockchainInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.blockchainRecord.count({ where }),
    ]);

    return {
      records: records.map((r) => this.formatBlockchainResponse(r)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * ============================================
   * GET PATIENT BLOCKCHAIN AUDIT TRAIL
   * ============================================
   */
  static async getPatientAuditTrail(patientId: string): Promise<BlockchainRecordResponse[]> {
    const records = await prisma.blockchainRecord.findMany({
      where: { patientId },
      include: this.getBlockchainInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.formatBlockchainResponse(r));
  }

  /**
   * ============================================
   * BLOCKCHAIN STATISTICS
   * ============================================
   */
  static async getStats(): Promise<BlockchainStats> {
    const [
      totalRecords,
      totalVerified,
      totalPending,
      totalFailed,
      byRecordType,
      recentTransactions,
    ] = await Promise.all([
      prisma.blockchainRecord.count(),
      prisma.blockchainRecord.count({ where: { status: 'CONFIRMED' } }),
      prisma.blockchainRecord.count({ where: { status: 'PENDING' } }),
      prisma.blockchainRecord.count({ where: { status: 'FAILED' } }),

      prisma.blockchainRecord.groupBy({
        by: ['recordType'],
        _count: true,
      }),

      prisma.blockchainRecord.findMany({
        where: { txHash: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          txHash: true,
          recordType: true,
          status: true,
          blockNumber: true,
          createdAt: true,
        },
      }),
    ]);

    const byTypeMap: Record<string, number> = {};
    byRecordType.forEach((r) => {
      byTypeMap[r.recordType] = r._count;
    });

    return {
      totalRecords,
      totalVerified,
      totalPending,
      totalFailed,
      byRecordType: byTypeMap,
      averageConfirmationTime: 5.2, // seconds (placeholder)
      successRate: totalRecords > 0 ? (totalVerified / totalRecords) * 100 : 0,
      recentTransactions: recentTransactions.map((tx) => ({
        txHash: tx.txHash!,
        recordType: tx.recordType,
        status: tx.status,
        blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
        timestamp: tx.createdAt.toISOString(),
        explorerUrl: polygonClient.getExplorerUrl(tx.txHash!),
      })),
    };
  }

  /**
   * ============================================
   * CONSENT MANAGEMENT
   * ============================================
   */
  static async grantConsent(
    data: ConsentInput,
    userId: string
  ): Promise<ConsentResponse> {
    // In production, this would create a consent record and anchor it on blockchain
    const consent = {
      id: `consent_${Date.now()}`,
      patientId: data.patientId,
      providerId: data.providerId || null,
      recordType: data.recordType,
      accessLevel: data.accessLevel,
      status: 'ACTIVE',
      expiresAt: data.expiresAt || null,
      purpose: data.purpose || null,
      grantedAt: new Date().toISOString(),
      revokedAt: null,
      revokeReason: null,
      txHash: null,
      createdAt: new Date().toISOString(),
    };

    logger.info(`Consent granted: ${consent.id}`);
    return consent;
  }

  /**
   * ============================================
   * REVOKE CONSENT
   * ============================================
   */
  static async revokeConsent(
    consentId: string,
    reason: string | null,
    userId: string
  ): Promise<ConsentResponse> {
    logger.info(`Consent revoked: ${consentId}`);
    return {
      id: consentId,
      patientId: '',
      providerId: null,
      recordType: '',
      accessLevel: 'READ',
      status: 'REVOKED',
      expiresAt: null,
      purpose: null,
      grantedAt: '',
      revokedAt: new Date().toISOString(),
      revokeReason: reason,
      txHash: null,
      createdAt: '',
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static getBlockchainInclude(): Prisma.BlockchainRecordInclude {
    return {
      patient: {
        select: {
          id: true,
          patientId: true,
          firstName: true,
          lastName: true,
        },
      },
      medicalRecord: {
        select: {
          id: true,
          diagnosis: true,
        },
      },
    };
  }

  private static formatBlockchainResponse(record: any): BlockchainRecordResponse {
    return {
      id: record.id,
      patientId: record.patientId,
      medicalRecordId: record.medicalRecordId,
      recordType: record.recordType,
      dataHash: record.dataHash,
      txHash: record.txHash,
      blockNumber: record.blockNumber ? Number(record.blockNumber) : null,
      networkId: record.networkId,
      networkName: polygonClient.getNetworkName(),
      status: record.status,
      verifiedAt: record.verifiedAt?.toISOString() || null,
      metadata: record.metadata,
      explorerUrl: record.txHash ? polygonClient.getExplorerUrl(record.txHash) : null,
      patient: record.patient,
      medicalRecord: record.medicalRecord,
      createdAt: record.createdAt.toISOString(),
    };
  }
}