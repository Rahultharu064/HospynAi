"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const config_1 = require("../../../config");
const polygonClient_1 = require("../../../integration/blockchain/polygonClient");
const errors_1 = require("../../../utils/errors");
const blockchainHash_1 = require("../../../utils/blockchainHash");
const logger_1 = __importDefault(require("../../../utils/logger"));
class BlockchainService {
    /**
     * Submit a PENDING blockchain_records row to the chain (used after EMR sign).
     */
    static async submitPendingAnchor(recordId) {
        const record = await prisma_1.default.blockchainRecord.findUnique({
            where: { id: recordId },
            include: {
                patient: { select: { patientId: true } },
            },
        });
        if (!record || record.status !== 'PENDING' || !record.patient) {
            return;
        }
        if (!polygonClient_1.polygonClient.isReady()) {
            logger_1.default.warn(`Blockchain not ready — record ${recordId} stays PENDING`);
            return;
        }
        try {
            const result = await polygonClient_1.polygonClient.anchorHash(record.dataHash, record.recordType, record.patient.patientId);
            if (!result) {
                await prisma_1.default.blockchainRecord.update({
                    where: { id: recordId },
                    data: { status: 'FAILED' },
                });
                return;
            }
            await prisma_1.default.blockchainRecord.update({
                where: { id: recordId },
                data: {
                    txHash: result.txHash,
                    blockNumber: BigInt(result.blockNumber),
                    networkId: polygonClient_1.polygonClient.getNetworkId(),
                    status: 'CONFIRMED',
                    verifiedAt: new Date(),
                },
            });
            logger_1.default.info(`Pending blockchain record confirmed on-chain: ${recordId}`);
        }
        catch (error) {
            await prisma_1.default.blockchainRecord.update({
                where: { id: recordId },
                data: { status: 'FAILED' },
            });
            throw error;
        }
    }
    static async anchorRecord(data, userId, ipAddress, userAgent) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: data.patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        if (data.medicalRecordId) {
            const emr = await prisma_1.default.medicalRecord.findUnique({
                where: { id: data.medicalRecordId },
            });
            if (!emr)
                throw new errors_1.NotFoundError('Medical record not found');
        }
        const timestamp = new Date().toISOString();
        const dataHash = (0, blockchainHash_1.hashAnchorPayload)({
            patientId: data.patientId,
            medicalRecordId: data.medicalRecordId,
            recordType: data.recordType,
            data: data.data,
            timestamp,
        });
        let txHash = null;
        let blockNumber = null;
        let networkId = null;
        let status = 'PENDING';
        if (polygonClient_1.polygonClient.isReady()) {
            try {
                const result = await polygonClient_1.polygonClient.anchorHash(dataHash, data.recordType, patient.patientId);
                if (result) {
                    txHash = result.txHash;
                    blockNumber = result.blockNumber;
                    networkId = polygonClient_1.polygonClient.getNetworkId();
                    status = 'CONFIRMED';
                }
            }
            catch {
                status = 'FAILED';
            }
        }
        const record = await prisma_1.default.$transaction(async (tx) => {
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
        logger_1.default.info(`Blockchain record anchored: ${dataHash.substring(0, 16)}... (${status})`);
        return this.formatBlockchainResponse(record);
    }
    static async verifyRecord(data) {
        let record = null;
        if (data.recordId) {
            record = await prisma_1.default.blockchainRecord.findUnique({
                where: { id: data.recordId },
            });
        }
        else if (data.dataHash) {
            record = await prisma_1.default.blockchainRecord.findFirst({
                where: { dataHash: data.dataHash },
                orderBy: { createdAt: 'desc' },
            });
        }
        else if (data.txHash) {
            record = await prisma_1.default.blockchainRecord.findFirst({
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
                networkName: polygonClient_1.polygonClient.getNetworkName(),
                explorerUrl: null,
                message: 'Record not found in database',
            };
        }
        const dataHash = record.dataHash;
        let onChainValid = false;
        if (polygonClient_1.polygonClient.isReady() && dataHash) {
            const onChain = await polygonClient_1.polygonClient.verifyHash(dataHash);
            onChainValid = onChain.exists && !onChain.isRevoked;
            if (onChainValid && record.status !== 'CONFIRMED') {
                await prisma_1.default.blockchainRecord.update({
                    where: { id: record.id },
                    data: { status: 'CONFIRMED', verifiedAt: new Date() },
                });
                record.status = 'CONFIRMED';
            }
        }
        const isVerified = record.status === 'CONFIRMED' && (onChainValid || !!record.txHash);
        const explorerUrl = record.txHash
            ? polygonClient_1.polygonClient.getExplorerUrl(record.txHash)
            : null;
        return {
            isVerified,
            dataHash: record.dataHash,
            onChainHash: dataHash,
            txHash: record.txHash,
            blockNumber: record.blockNumber ? Number(record.blockNumber) : null,
            timestamp: record.createdAt.toISOString(),
            networkName: polygonClient_1.polygonClient.getNetworkName(),
            explorerUrl,
            message: isVerified
                ? 'Record verified on blockchain'
                : record.status === 'PENDING'
                    ? 'Record pending on-chain confirmation'
                    : 'Record not confirmed on blockchain',
        };
    }
    static async listRecords(query) {
        const { page = 1, limit = 10, patientId, medicalRecordId, recordType, status, dateFrom, dateTo, } = query;
        const where = {};
        if (patientId)
            where.patientId = patientId;
        if (medicalRecordId)
            where.medicalRecordId = medicalRecordId;
        if (recordType)
            where.recordType = recordType;
        if (status)
            where.status = status;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom)
                where.createdAt.gte = new Date(dateFrom);
            if (dateTo)
                where.createdAt.lte = new Date(dateTo);
        }
        const skip = (page - 1) * limit;
        const [records, total] = await Promise.all([
            prisma_1.default.blockchainRecord.findMany({
                where,
                include: this.getBlockchainInclude(),
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.blockchainRecord.count({ where }),
        ]);
        return {
            records: records.map((r) => this.formatBlockchainResponse(r)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    static async getPatientAuditTrail(patientId) {
        const records = await prisma_1.default.blockchainRecord.findMany({
            where: { patientId },
            include: this.getBlockchainInclude(),
            orderBy: { createdAt: 'desc' },
        });
        return records.map((r) => this.formatBlockchainResponse(r));
    }
    static async getStats() {
        const [totalRecords, totalVerified, totalPending, totalFailed, byRecordType, recentTransactions,] = await Promise.all([
            prisma_1.default.blockchainRecord.count(),
            prisma_1.default.blockchainRecord.count({ where: { status: 'CONFIRMED' } }),
            prisma_1.default.blockchainRecord.count({ where: { status: 'PENDING' } }),
            prisma_1.default.blockchainRecord.count({ where: { status: 'FAILED' } }),
            prisma_1.default.blockchainRecord.groupBy({
                by: ['recordType'],
                _count: true,
            }),
            prisma_1.default.blockchainRecord.findMany({
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
        const byTypeMap = {};
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
                txHash: tx.txHash,
                recordType: tx.recordType,
                status: tx.status,
                blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
                timestamp: tx.createdAt.toISOString(),
                explorerUrl: polygonClient_1.polygonClient.getExplorerUrl(tx.txHash),
            })),
            blockchainEnabled: config_1.config.blockchain.enabled,
            chainReady: polygonClient_1.polygonClient.isReady(),
            networkName: polygonClient_1.polygonClient.getNetworkName(),
            networkId: polygonClient_1.polygonClient.getNetworkId(),
        };
    }
    static async grantConsent(data, userId) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: data.patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        const providerAddress = polygonClient_1.polygonClient.getDefaultProviderAddress();
        if (!providerAddress || providerAddress === ethersZero()) {
            throw new errors_1.BadRequestError('Blockchain provider address is not configured');
        }
        const grantedAt = new Date().toISOString();
        const dataHash = (0, blockchainHash_1.hashConsentPayload)({
            patientId: patient.patientId,
            providerAddress,
            recordType: data.recordType,
            accessLevel: data.accessLevel,
            grantedAt,
        });
        const expiresAtUnix = data.expiresAt
            ? Math.floor(new Date(data.expiresAt).getTime() / 1000)
            : 0;
        let txHash = null;
        let onChainConsentId = null;
        let status = 'PENDING';
        if (polygonClient_1.polygonClient.isConsentReady()) {
            try {
                const result = await polygonClient_1.polygonClient.grantConsent(patient.patientId, providerAddress, data.recordType, data.accessLevel, expiresAtUnix);
                if (result) {
                    txHash = result.txHash;
                    onChainConsentId = result.onChainConsentId;
                    status = 'ACTIVE';
                }
            }
            catch {
                status = 'FAILED';
            }
        }
        else if (!config_1.config.blockchain.enabled) {
            status = 'ACTIVE';
        }
        const record = await prisma_1.default.blockchainRecord.create({
            data: {
                patientId: data.patientId,
                recordType: 'CONSENT',
                dataHash,
                txHash,
                networkId: txHash ? polygonClient_1.polygonClient.getNetworkId() : null,
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
        logger_1.default.info(`Consent recorded: ${record.id} (${status})`);
        return this.formatConsentResponse(record);
    }
    static async revokeConsent(consentId, reason, userId) {
        const record = await prisma_1.default.blockchainRecord.findFirst({
            where: { id: consentId, recordType: 'CONSENT' },
        });
        if (!record) {
            throw new errors_1.NotFoundError('Consent record not found');
        }
        const metadata = record.metadata || {};
        const onChainConsentId = metadata.onChainConsentId;
        let txHash = record.txHash;
        if (onChainConsentId && polygonClient_1.polygonClient.isConsentReady()) {
            const revokeTx = await polygonClient_1.polygonClient.revokeConsent(onChainConsentId, reason || 'Revoked via API');
            if (revokeTx)
                txHash = revokeTx;
        }
        const updated = await prisma_1.default.blockchainRecord.update({
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
        logger_1.default.info(`Consent revoked: ${consentId}`);
        return this.formatConsentResponse(updated);
    }
    static getBlockchainInclude() {
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
    static formatBlockchainResponse(record) {
        return {
            id: record.id,
            patientId: record.patientId,
            medicalRecordId: record.medicalRecordId,
            recordType: record.recordType,
            dataHash: record.dataHash,
            txHash: record.txHash,
            blockNumber: record.blockNumber ? Number(record.blockNumber) : null,
            networkId: record.networkId,
            networkName: polygonClient_1.polygonClient.getNetworkName(),
            status: record.status,
            verifiedAt: record.verifiedAt?.toISOString() || null,
            metadata: record.metadata,
            explorerUrl: record.txHash ? polygonClient_1.polygonClient.getExplorerUrl(record.txHash) : null,
            patient: record.patient,
            medicalRecord: record.medicalRecord,
            createdAt: record.createdAt.toISOString(),
        };
    }
    static formatConsentResponse(record) {
        const metadata = record.metadata || {};
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
exports.BlockchainService = BlockchainService;
function ethersZero() {
    return '0x0000000000000000000000000000000000000000';
}
//# sourceMappingURL=blockchainService.js.map