import crypto from 'crypto';
import { Prisma, BlockchainRecordType } from '@prisma/client';
import prisma from '../../../config/prisma';
import { config } from '../../../config';
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
import {
  hashAnchorPayload,
  hashConsentPayload,
} from '../../../utils/blockchainHash';
import logger from '../../../utils/logger';

export class BlockchainService {
  /**
   * Submit a PENDING blockchain_records row to the chain (used after EMR sign).
   */
  static async submitPendingAnchor(recordId: string): Promise<void> {
    const record = await prisma.blockchainRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: { select: { patientId: true } },
      },
    });

    if (!record || record.status !== 'PENDING' || !record.patient) {
      return;
    }

    if (!polygonClient.isReady()) {
      logger.warn(`Blockchain not ready — record ${recordId} stays PENDING`);
      return;
    }

    try {
      const result = await polygonClient.anchorHash(
        record.dataHash,
        record.recordType,
        record.patient.patientId
      );

      if (!result) {
        await prisma.blockchainRecord.update({
          where: { id: recordId },
          data: { status: 'FAILED' },
        });
        return;
      }

      await prisma.blockchainRecord.update({
        where: { id: recordId },
        data: {
          txHash: result.txHash,
          blockNumber: BigInt(result.blockNumber),
          networkId: polygonClient.getNetworkId(),
          status: 'CONFIRMED',
          verifiedAt: new Date(),
        },
      });

      logger.info(`Pending blockchain record confirmed on-chain: ${recordId}`);
    } catch (error) {
      await prisma.blockchainRecord.update({
        where: { id: recordId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  static async anchorRecord(
    data: AnchorRecordInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<BlockchainRecordResponse> {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient || patient.deletedAt) {
      throw new NotFoundError('Patient not found');
    }

    if (data.medicalRecordId) {
      const emr = await prisma.medicalRecord.findUnique({
        where: { id: data.medicalRecordId },
      });
      if (!emr) throw new NotFoundError('Medical record not found');
    }

    const timestamp = new Date().toISOString();
    const dataHash = hashAnchorPayload({
      patientId: data.patientId,
      medicalRecordId: data.medicalRecordId,
      recordType: data.recordType,
      data: data.data,
      timestamp,
    });

    let txHash: string | null = null;
    let blockNumber: number | null = null;
    let networkId: number | null = null;
    let status: 'PENDING' | 'CONFIRMED' | 'FAILED' = 'PENDING';

    if (polygonClient.isReady()) {
      try {
        const result = await polygonClient.anchorHash(
          dataHash,
          data.recordType,
          patient.patientId
        );

        if (result) {
          txHash = result.txHash;
          blockNumber = result.blockNumber;
          networkId = polygonClient.getNetworkId();
          status = 'CONFIRMED';
        }
      } catch {
        status = 'FAILED';
      }
    }

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
          status,
          verifiedAt: status === 'CONFIRMED' ? new Date() : null,
          metadata: {
            ...data.metadata,
            anchoredBy: userId,
            dataSnapshot: data.data,
            anchoredAt: timestamp,
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
          metadata: { dataHash, txHash, recordType: data.recordType, status },
        },
      });

      return created;
    });

    logger.info(`Blockchain record anchored: ${dataHash.substring(0, 16)}... (${status})`);
    return this.formatBlockchainResponse(record);
  }

  static async verifyRecord(data: VerifyRecordInput): Promise<VerificationResult> {
    let record: any = null;

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

    const dataHash = record.dataHash;
    let onChainValid = false;

    if (polygonClient.isReady() && dataHash) {
      const onChain = await polygonClient.verifyHash(dataHash);
      onChainValid = onChain.exists && !onChain.isRevoked;

      if (onChainValid && record.status !== 'CONFIRMED') {
        await prisma.blockchainRecord.update({
          where: { id: record.id },
          data: { status: 'CONFIRMED', verifiedAt: new Date() },
        });
        record.status = 'CONFIRMED';
      }
    }

    const isVerified =
      record.status === 'CONFIRMED' && (onChainValid || !!record.txHash);
    const explorerUrl = record.txHash
      ? polygonClient.getExplorerUrl(record.txHash)
      : null;

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
        ? 'Record verified on blockchain'
        : record.status === 'PENDING'
          ? 'Record pending on-chain confirmation'
          : 'Record not confirmed on blockchain',
    };
  }

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

  static async getPatientAuditTrail(patientId: string): Promise<BlockchainRecordResponse[]> {
    const records = await prisma.blockchainRecord.findMany({
      where: { patientId },
      include: this.getBlockchainInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => this.formatBlockchainResponse(r));
  }

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
      averageConfirmationTime: 0,
      successRate: totalRecords > 0 ? (totalVerified / totalRecords) * 100 : 0,
      recentTransactions: recentTransactions.map((tx) => ({
        txHash: tx.txHash!,
        recordType: tx.recordType,
        status: tx.status,
        blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
        timestamp: tx.createdAt.toISOString(),
        explorerUrl: polygonClient.getExplorerUrl(tx.txHash!),
      })),
      blockchainEnabled: config.blockchain.enabled,
      chainReady: polygonClient.isReady(),
      networkName: polygonClient.getNetworkName(),
      networkId: polygonClient.getNetworkId(),
    };
  }

  static async grantConsent(
    data: ConsentInput,
    userId: string
  ): Promise<ConsentResponse> {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient || patient.deletedAt) {
      throw new NotFoundError('Patient not found');
    }

    const providerAddress = polygonClient.getDefaultProviderAddress();
    if (!providerAddress || providerAddress === ethersZero()) {
      throw new BadRequestError('Blockchain provider address is not configured');
    }

    const grantedAt = new Date().toISOString();
    const dataHash = hashConsentPayload({
      patientId: patient.patientId,
      providerAddress,
      recordType: data.recordType,
      accessLevel: data.accessLevel,
      grantedAt,
    });

    const expiresAtUnix = data.expiresAt
      ? Math.floor(new Date(data.expiresAt).getTime() / 1000)
      : 0;

    let txHash: string | null = null;
    let onChainConsentId: string | null = null;
    let status: 'ACTIVE' | 'PENDING' | 'FAILED' = 'PENDING';

    if (polygonClient.isConsentReady()) {
      try {
        const result = await polygonClient.grantConsent(
          patient.patientId,
          providerAddress,
          data.recordType,
          data.accessLevel,
          expiresAtUnix
        );
        if (result) {
          txHash = result.txHash;
          onChainConsentId = result.onChainConsentId;
          status = 'ACTIVE';
        }
      } catch {
        status = 'FAILED';
      }
    } else if (!config.blockchain.enabled) {
      status = 'ACTIVE';
    }

    const record = await prisma.blockchainRecord.create({
      data: {
        patientId: data.patientId,
        recordType: 'CONSENT',
        dataHash,
        txHash,
        networkId: txHash ? polygonClient.getNetworkId() : null,
        status: status === 'ACTIVE' ? 'CONFIRMED' : status === 'FAILED' ? 'FAILED' : 'PENDING',
        metadata: {
          consentType: 'PATIENT_PROVIDER',
          providerId: data.providerId ?? null,
          providerAddress,
          recordType: data.recordType,
          accessLevel: data.accessLevel,
          purpose: data.purpose ?? null,
          expiresAt: data.expiresAt ?? null,
          onChainConsentId,
          grantedBy: userId,
          grantedAt,
          consentStatus: status,
        },
      },
    });

    logger.info(`Consent recorded: ${record.id} (${status})`);
    return this.formatConsentResponse(record);
  }

  static async revokeConsent(
    consentId: string,
    reason: string | null,
    userId: string
  ): Promise<ConsentResponse> {
    const record = await prisma.blockchainRecord.findFirst({
      where: { id: consentId, recordType: 'CONSENT' },
    });

    if (!record) {
      throw new NotFoundError('Consent record not found');
    }

    const metadata = (record.metadata as Record<string, any>) || {};
    const onChainConsentId = metadata.onChainConsentId as string | undefined;

    let txHash = record.txHash;

    if (onChainConsentId && polygonClient.isConsentReady()) {
      const revokeTx = await polygonClient.revokeConsent(
        onChainConsentId,
        reason || 'Revoked via API'
      );
      if (revokeTx) txHash = revokeTx;
    }

    const updated = await prisma.blockchainRecord.update({
      where: { id: record.id },
      data: {
        status: 'REVOKED',
        metadata: {
          ...metadata,
          consentStatus: 'REVOKED',
          revokedAt: new Date().toISOString(),
          revokeReason: reason,
          revokedBy: userId,
          revokeTxHash: txHash,
        },
      },
    });

    logger.info(`Consent revoked: ${consentId}`);
    return this.formatConsentResponse(updated);
  }

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

  private static formatConsentResponse(record: any): ConsentResponse {
    const metadata = (record.metadata as Record<string, any>) || {};
    return {
      id: record.id,
      patientId: record.patientId,
      providerId: metadata.providerId ?? null,
      recordType: metadata.recordType ?? '',
      accessLevel: metadata.accessLevel ?? 'READ',
      status: metadata.consentStatus ?? record.status,
      expiresAt: metadata.expiresAt ?? null,
      purpose: metadata.purpose ?? null,
      grantedAt: metadata.grantedAt ?? record.createdAt.toISOString(),
      revokedAt: metadata.revokedAt ?? null,
      revokeReason: metadata.revokeReason ?? null,
      txHash: record.txHash,
      createdAt: record.createdAt.toISOString(),
    };
  }
}

function ethersZero(): string {
  return '0x0000000000000000000000000000000000000000';
}
