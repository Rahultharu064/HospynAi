"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionService = void 0;
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class PrescriptionService {
    /**
     * Create prescription
     */
    static async createPrescription(data, userId, ipAddress, userAgent) {
        // Validate medical record
        const emr = await prisma_1.default.medicalRecord.findUnique({
            where: { id: data.medicalRecordId },
        });
        if (!emr)
            throw new errors_1.NotFoundError('Medical record not found');
        if (emr.patientId !== data.patientId) {
            throw new errors_1.BadRequestError('Patient mismatch');
        }
        // Check for drug interactions (simplified)
        const existingPrescriptions = await prisma_1.default.prescription.findMany({
            where: {
                patientId: data.patientId,
                status: 'ACTIVE',
            },
            select: { drugName: true, genericName: true },
        });
        const drugInteractions = this.checkDrugInteractions(data.drugName, existingPrescriptions);
        const prescription = await prisma_1.default.$transaction(async (tx) => {
            const created = await tx.prescription.create({
                data: {
                    medicalRecordId: data.medicalRecordId,
                    patientId: data.patientId,
                    doctorId: userId,
                    drugName: data.drugName,
                    genericName: data.genericName || null,
                    dosage: data.dosage,
                    frequency: data.frequency,
                    duration: data.duration,
                    quantity: data.quantity || null,
                    route: data.route || null,
                    instructions: data.instructions || null,
                    startDate: data.startDate ? new Date(data.startDate) : new Date(),
                    endDate: data.endDate ? new Date(data.endDate) : null,
                    refillsAllowed: data.refillsAllowed || 0,
                    isControlled: data.isControlled || false,
                    drugInteractions: drugInteractions.length > 0 ? drugInteractions : null,
                    createdById: userId,
                },
                include: {
                    doctor: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'PRESCRIPTION_CREATED',
                    resource: 'PRESCRIPTION',
                    resourceId: created.id,
                    ipAddress,
                    userAgent,
                },
            });
            return created;
        });
        logger_1.default.info(`Prescription created: ${prescription.id}`);
        return this.formatPrescriptionResponse(prescription);
    }
    /**
     * Get patient prescriptions
     */
    static async getPatientPrescriptions(patientId) {
        return prisma_1.default.prescription.findMany({
            where: { patientId },
            include: {
                doctor: { select: { id: true, firstName: true, lastName: true } },
                medicalRecord: { select: { id: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    /**
     * Discontinue prescription
     */
    static async discontinuePrescription(id, userId, ipAddress, userAgent) {
        const prescription = await prisma_1.default.prescription.findUnique({ where: { id } });
        if (!prescription)
            throw new errors_1.NotFoundError('Prescription not found');
        const updated = await prisma_1.default.prescription.update({
            where: { id },
            data: { status: 'DISCONTINUED' },
            include: {
                doctor: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        return this.formatPrescriptionResponse(updated);
    }
    // Drug interaction checker (simplified)
    static checkDrugInteractions(newDrug, existingPrescriptions) {
        // In production, this would check against a drug interaction database
        return [];
    }
    static formatPrescriptionResponse(p) {
        return {
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
        };
    }
}
exports.PrescriptionService = PrescriptionService;
//# sourceMappingURL=prescriptionService.js.map