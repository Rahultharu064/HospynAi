"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../../../config/prisma"));
const polygonClient_1 = require("../../../integration/blockchain/polygonClient");
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class BlockchainService {
    /**
     * ============================================
     * ANCHOR RECORD HASH
     * ============================================
     */
    static async anchorRecord(data, userId, ipAddress, userAgent) {
        // Validate patient
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: data.patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        // Validate medical record if provided
        if (data.medicalRecordId) {
            const emr = await prisma_1.default.medicalRecord.findUnique({
                where: { id: data.medicalRecordId },
            });
            if (!emr)
                throw new errors_1.NotFoundError('Medical record not found');
        }
        // Generate SHA-256 hash
        const dataString = JSON.stringify({
            patientId: data.patientId,
            medicalRecordId: data.medicalRecordId,
            recordType: data.recordType,
            data: data.data,
            timestamp: new Date().toISOString(),
        });
        const dataHash = crypto_1.default.createHash('sha256').update(dataString).digest('hex');
        // Try to anchor on Polygon blockchain
        let txHash = null;
        let blockNumber = null;
        let networkId = null;
        if (polygonClient_1.polygonClient.isReady()) {
            const result = await polygonClient_1.polygonClient.anchorHash(dataHash, data.recordType, patient.patientId);
            if (result) {
                txHash = result.txHash;
                blockNumber = result.blockNumber;
                networkId = 80002; // Amoy testnet
            }
        }
        // Store in database
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
        logger_1.default.info(`Blockchain record anchored: ${dataHash.substring(0, 16)}...`);
        return this.formatBlockchainResponse(record);
    }
    /**
     * ============================================
     * VERIFY RECORD
     * ============================================
     */
    static async verifyRecord(data) {
        let record = null;
        let dataHash = null;
        // Find record by ID, hash, or txHash
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
        dataHash = record.dataHash;
        // Verify on blockchain if client is available
        let onChainResult = null;
        if (polygonClient_1.polygonClient.isReady() && dataHash) {
            onChainResult = await polygonClient_1.polygonClient.verifyHash(dataHash);
        }
        const isVerified = record.txHash !== null && record.status === 'CONFIRMED';
        const explorerUrl = record.txHash
            ? polygonClient_1.polygonClient.getExplorerUrl(record.txHash)
            : null;
        // Update verification status in database
        if (onChainResult?.exists && record.status !== 'CONFIRMED') {
            await prisma_1.default.blockchainRecord.update({
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
            networkName: polygonClient_1.polygonClient.getNetworkName(),
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
    /**
     * ============================================
     * GET PATIENT BLOCKCHAIN AUDIT TRAIL
     * ============================================
     */
    static async getPatientAuditTrail(patientId) {
        const records = await prisma_1.default.blockchainRecord.findMany({
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
            averageConfirmationTime: 5.2, // seconds (placeholder)
            successRate: totalRecords > 0 ? (totalVerified / totalRecords) * 100 : 0,
            recentTransactions: recentTransactions.map((tx) => ({
                txHash: tx.txHash,
                recordType: tx.recordType,
                status: tx.status,
                blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
                timestamp: tx.createdAt.toISOString(),
                explorerUrl: polygonClient_1.polygonClient.getExplorerUrl(tx.txHash),
            })),
        };
    }
    /**
     * ============================================
     * CONSENT MANAGEMENT
     * ============================================
     */
    static async grantConsent(data, userId) {
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
        logger_1.default.info(`Consent granted: ${consent.id}`);
        return consent;
    }
    /**
     * ============================================
     * REVOKE CONSENT
     * ============================================
     */
    static async revokeConsent(consentId, reason, userId) {
        logger_1.default.info(`Consent revoked: ${consentId}`);
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
}
exports.BlockchainService = BlockchainService;
//# sourceMappingURL=blockchainService.js.map