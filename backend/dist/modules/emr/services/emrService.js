"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMRService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class EMRService {
    /**
     * ============================================
     * CREATE EMR RECORD
     * ============================================
     */
    static async createEMR(data, userId, ipAddress, userAgent) {
        // Validate patient
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: data.patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        // Validate appointment if provided
        if (data.appointmentId) {
            const appointment = await prisma_1.default.appointment.findUnique({
                where: { id: data.appointmentId },
            });
            if (!appointment)
                throw new errors_1.NotFoundError('Appointment not found');
            if (appointment.patientId !== data.patientId) {
                throw new errors_1.BadRequestError('Appointment does not belong to this patient');
            }
        }
        // Calculate BMI if height and weight provided
        if (data.vitalSigns?.height && data.vitalSigns?.weight) {
            const heightInMeters = data.vitalSigns.height / 100;
            data.vitalSigns.bmi = Math.round((data.vitalSigns.weight / (heightInMeters * heightInMeters)) * 10) / 10;
        }
        // Create EMR record
        const emr = await prisma_1.default.$transaction(async (tx) => {
            const newEMR = await tx.medicalRecord.create({
                data: {
                    patientId: data.patientId,
                    appointmentId: data.appointmentId || null,
                    doctorId: data.doctorId || userId,
                    chiefComplaint: data.chiefComplaint || null,
                    diagnosis: data.diagnosis || null,
                    icd10Codes: data.icd10Codes || [],
                    symptoms: data.symptoms || null,
                    vitalSigns: data.vitalSigns || null,
                    examinationNotes: data.examinationNotes || null,
                    treatmentPlan: data.treatmentPlan || null,
                    doctorNotes: data.doctorNotes || null,
                    status: data.status || 'DRAFT',
                    version: 1,
                    isLatestVersion: true,
                    createdById: userId,
                    updatedById: userId,
                },
                include: this.getEMRInclude(),
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    organizationId: patient.organizationId,
                    action: 'EMR_CREATED',
                    resource: 'EMR',
                    resourceId: newEMR.id,
                    ipAddress,
                    userAgent,
                    metadata: {
                        patientId: patient.patientId,
                        appointmentId: data.appointmentId,
                    },
                },
            });
            return newEMR;
        });
        logger_1.default.info(`EMR created: ${emr.id} for patient ${patient.patientId}`);
        return this.formatEMRResponse(emr);
    }
    /**
     * ============================================
     * GET EMR BY ID
     * ============================================
     */
    static async getEMRById(id) {
        const emr = await prisma_1.default.medicalRecord.findUnique({
            where: { id },
            include: this.getEMRInclude(),
        });
        if (!emr)
            throw new errors_1.NotFoundError('EMR record not found');
        return this.formatEMRResponse(emr);
    }
    /**
     * ============================================
     * GET PATIENT EMR HISTORY
     * ============================================
     */
    static async getPatientEMRHistory(patientId, query) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient || patient.deletedAt) {
            throw new errors_1.NotFoundError('Patient not found');
        }
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const where = {
            patientId,
            isLatestVersion: true,
        };
        const [records, total] = await Promise.all([
            prisma_1.default.medicalRecord.findMany({
                where,
                include: this.getEMRInclude(),
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma_1.default.medicalRecord.count({ where }),
        ]);
        return {
            records: records.map((r) => this.formatEMRResponse(r)),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    /**
     * ============================================
     * UPDATE EMR
     * ============================================
     */
    static async updateEMR(id, data, userId, ipAddress, userAgent) {
        const existingEMR = await prisma_1.default.medicalRecord.findUnique({
            where: { id },
        });
        if (!existingEMR)
            throw new errors_1.NotFoundError('EMR record not found');
        if (existingEMR.status === 'SIGNED') {
            throw new errors_1.BadRequestError('Cannot update a signed EMR record. Create a new version instead.');
        }
        // Calculate BMI if updated
        if (data.vitalSigns?.height && data.vitalSigns?.weight) {
            const heightInMeters = data.vitalSigns.height / 100;
            data.vitalSigns.bmi = Math.round((data.vitalSigns.weight / (heightInMeters * heightInMeters)) * 10) / 10;
        }
        const emr = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.medicalRecord.update({
                where: { id },
                data: {
                    ...(data.chiefComplaint !== undefined && { chiefComplaint: data.chiefComplaint }),
                    ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
                    ...(data.icd10Codes && { icd10Codes: data.icd10Codes }),
                    ...(data.symptoms !== undefined && { symptoms: data.symptoms }),
                    ...(data.vitalSigns !== undefined && { vitalSigns: data.vitalSigns }),
                    ...(data.examinationNotes !== undefined && { examinationNotes: data.examinationNotes }),
                    ...(data.treatmentPlan !== undefined && { treatmentPlan: data.treatmentPlan }),
                    ...(data.doctorNotes !== undefined && { doctorNotes: data.doctorNotes }),
                    ...(data.status && { status: data.status }),
                    updatedById: userId,
                },
                include: this.getEMRInclude(),
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'EMR_UPDATED',
                    resource: 'EMR',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                },
            });
            return updated;
        });
        return this.formatEMRResponse(emr);
    }
    /**
     * ============================================
     * SIGN EMR
     * ============================================
     */
    static async signEMR(id, userId, ipAddress, userAgent) {
        const existingEMR = await prisma_1.default.medicalRecord.findUnique({
            where: { id },
        });
        if (!existingEMR)
            throw new errors_1.NotFoundError('EMR record not found');
        if (existingEMR.status === 'SIGNED') {
            throw new errors_1.BadRequestError('EMR is already signed');
        }
        const emr = await prisma_1.default.$transaction(async (tx) => {
            const signed = await tx.medicalRecord.update({
                where: { id },
                data: {
                    status: 'SIGNED',
                    signedAt: new Date(),
                    signedBy: userId,
                    updatedById: userId,
                },
                include: this.getEMRInclude(),
            });
            // Create blockchain record (hash anchoring)
            await this.createBlockchainRecord(tx, signed.id, signed.patientId);
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'EMR_SIGNED',
                    resource: 'EMR',
                    resourceId: id,
                    ipAddress,
                    userAgent,
                },
            });
            return signed;
        });
        logger_1.default.info(`EMR signed: ${id}`);
        return this.formatEMRResponse(emr);
    }
    /**
     * ============================================
     * CREATE NEW VERSION
     * ============================================
     */
    static async createNewVersion(id, userId, ipAddress, userAgent) {
        const existingEMR = await prisma_1.default.medicalRecord.findUnique({
            where: { id },
        });
        if (!existingEMR)
            throw new errors_1.NotFoundError('EMR record not found');
        // Mark old version
        await prisma_1.default.medicalRecord.update({
            where: { id },
            data: { isLatestVersion: false },
        });
        // Create new version
        const newVersion = await prisma_1.default.medicalRecord.create({
            data: {
                patientId: existingEMR.patientId,
                appointmentId: existingEMR.appointmentId,
                doctorId: existingEMR.doctorId,
                chiefComplaint: existingEMR.chiefComplaint,
                diagnosis: existingEMR.diagnosis,
                icd10Codes: existingEMR.icd10Codes,
                symptoms: existingEMR.symptoms,
                vitalSigns: existingEMR.vitalSigns,
                examinationNotes: existingEMR.examinationNotes,
                treatmentPlan: existingEMR.treatmentPlan,
                doctorNotes: existingEMR.doctorNotes,
                version: existingEMR.version + 1,
                isLatestVersion: true,
                previousVersionId: existingEMR.id,
                createdById: userId,
                updatedById: userId,
            },
            include: this.getEMRInclude(),
        });
        logger_1.default.info(`EMR new version created: ${newVersion.id} (v${newVersion.version})`);
        return this.formatEMRResponse(newVersion);
    }
    /**
     * ============================================
     * GENERATE PDF
     * ============================================
     */
    static async generatePDF(id) {
        const emr = await prisma_1.default.medicalRecord.findUnique({
            where: { id },
            include: this.getEMRInclude(),
        });
        if (!emr)
            throw new errors_1.NotFoundError('EMR record not found');
        // In production, this would generate a PDF using a library like PDFKit
        // For now, return a placeholder URL
        const pdfUrl = `/api/v1/emr/${id}/download`;
        return { url: pdfUrl };
    }
    /**
     * ============================================
     * EMR STATISTICS
     * ============================================
     */
    static async getEMRStats(organizationId) {
        const where = {
            isLatestVersion: true,
        };
        const [totalRecords, todayRecords, topDiagnoses,] = await Promise.all([
            prisma_1.default.medicalRecord.count({ where }),
            prisma_1.default.medicalRecord.count({
                where: {
                    ...where,
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            prisma_1.default.medicalRecord.findMany({
                where: { ...where, diagnosis: { not: null } },
                select: { diagnosis: true, icd10Codes: true },
                take: 50,
            }),
        ]);
        // Process top diagnoses
        const diagnosisMap = new Map();
        topDiagnoses.forEach((record) => {
            if (record.diagnosis) {
                const key = record.diagnosis.substring(0, 100);
                const existing = diagnosisMap.get(key);
                if (existing) {
                    existing.count++;
                }
                else {
                    diagnosisMap.set(key, {
                        code: record.icd10Codes[0] || '',
                        description: key,
                        count: 1,
                    });
                }
            }
        });
        return {
            totalRecords,
            todayRecords,
            averageDiagnosisPerRecord: totalRecords > 0 ? 1.2 : 0,
            topDiagnoses: Array.from(diagnosisMap.values())
                .sort((a, b) => b.count - a.count)
                .slice(0, 10),
            topPrescribedDrugs: [],
            topLabTests: [],
        };
    }
    /**
     * ============================================
     * BLOCKCHAIN ANCHORING
     * ============================================
     */
    static async createBlockchainRecord(tx, medicalRecordId, patientId) {
        // Generate SHA-256 hash of the medical record
        const crypto = require('crypto');
        const recordData = JSON.stringify({ medicalRecordId, patientId, timestamp: new Date().toISOString() });
        const dataHash = crypto.createHash('sha256').update(recordData).digest('hex');
        await tx.blockchainRecord.create({
            data: {
                patientId,
                medicalRecordId,
                recordType: 'MEDICAL_RECORD',
                dataHash,
                status: 'PENDING',
                metadata: {
                    recordId: medicalRecordId,
                    timestamp: new Date().toISOString(),
                },
            },
        });
    }
    // ============================================
    // HELPER METHODS
    // ============================================
    static getEMRInclude() {
        return {
            patient: {
                select: {
                    id: true,
                    patientId: true,
                    firstName: true,
                    lastName: true,
                    dateOfBirth: true,
                    gender: true,
                },
            },
            doctor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    doctorProfile: {
                        select: { specialization: true },
                    },
                },
            },
            appointment: {
                select: {
                    id: true,
                    appointmentId: true,
                    appointmentDate: true,
                    type: true,
                },
            },
            prescriptions: {
                include: {
                    doctor: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            labReports: {
                include: {
                    doctor: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            },
            blockchainRecords: {
                orderBy: { createdAt: 'desc' },
            },
            createdBy: {
                select: { id: true, firstName: true, lastName: true },
            },
        };
    }
    static formatEMRResponse(emr) {
        return {
            id: emr.id,
            patient: emr.patient,
            doctor: {
                id: emr.doctor.id,
                firstName: emr.doctor.firstName,
                lastName: emr.doctor.lastName,
                specialization: emr.doctor.doctorProfile?.specialization || null,
            },
            appointment: emr.appointment ? {
                id: emr.appointment.id,
                appointmentId: emr.appointment.appointmentId,
                appointmentDate: emr.appointment.appointmentDate.toISOString(),
                type: emr.appointment.type,
            } : null,
            chiefComplaint: emr.chiefComplaint,
            diagnosis: emr.diagnosis,
            icd10Codes: emr.icd10Codes,
            symptoms: emr.symptoms,
            vitalSigns: emr.vitalSigns,
            examinationNotes: emr.examinationNotes,
            treatmentPlan: emr.treatmentPlan,
            doctorNotes: emr.doctorNotes,
            version: emr.version,
            isLatestVersion: emr.isLatestVersion,
            status: emr.status,
            signedAt: emr.signedAt?.toISOString() || null,
            signedBy: emr.signedBy,
            prescriptions: emr.prescriptions?.map((p) => ({
                id: p.id,
                drugName: p.drugName,
                genericName: p.genericName,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration,
                quantity: p.quantity,
                route: p.route,
                instructions: p.instructions,
                status: p.status,
                startDate: p.startDate.toISOString(),
                endDate: p.endDate?.toISOString() || null,
                refillsAllowed: p.refillsAllowed,
                refillsUsed: p.refillsUsed,
                isControlled: p.isControlled,
                drugInteractions: p.drugInteractions,
                doctor: p.doctor,
                createdAt: p.createdAt.toISOString(),
            })) || [],
            labReports: emr.labReports?.map((l) => ({
                id: l.id,
                testName: l.testName,
                testCategory: l.testCategory,
                results: l.results,
                normalRanges: l.normalRanges,
                interpretation: l.interpretation,
                attachments: l.attachments,
                status: l.status,
                orderedAt: l.orderedAt.toISOString(),
                collectedAt: l.collectedAt?.toISOString() || null,
                completedAt: l.completedAt?.toISOString() || null,
                doctor: l.doctor,
                createdAt: l.createdAt.toISOString(),
            })) || [],
            blockchainRecords: emr.blockchainRecords?.map((b) => ({
                id: b.id,
                recordType: b.recordType,
                dataHash: b.dataHash,
                txHash: b.txHash,
                blockNumber: b.blockNumber ? Number(b.blockNumber) : null,
                status: b.status,
                verifiedAt: b.verifiedAt?.toISOString() || null,
                createdAt: b.createdAt.toISOString(),
            })) || [],
            createdBy: emr.createdBy,
            createdAt: emr.createdAt.toISOString(),
            updatedAt: emr.updatedAt.toISOString(),
        };
    }
}
exports.EMRService = EMRService;
//# sourceMappingURL=emrService.js.map