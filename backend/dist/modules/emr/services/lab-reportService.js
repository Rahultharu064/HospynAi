"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabReportService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../config/prisma"));
const errors_1 = require("../../../utils/errors");
const logger_1 = __importDefault(require("../../../utils/logger"));
class LabReportService {
    /**
     * Create lab report
     */
    static async createLabReport(data, userId, ipAddress, userAgent) {
        const patient = await prisma_1.default.patient.findUnique({
            where: { id: data.patientId },
        });
        if (!patient || patient.deletedAt)
            throw new errors_1.NotFoundError('Patient not found');
        const report = await prisma_1.default.$transaction(async (tx) => {
            const created = await tx.labReport.create({
                data: {
                    medicalRecordId: data.medicalRecordId || null,
                    patientId: data.patientId,
                    doctorId: data.doctorId || userId,
                    testName: data.testName,
                    testCategory: data.testCategory || null,
                    results: data.results,
                    normalRanges: data.normalRanges || client_1.Prisma.JsonNull,
                    interpretation: data.interpretation || null,
                    status: data.status || 'PENDING',
                    orderedAt: new Date(),
                    createdById: userId,
                },
                include: {
                    doctor: { select: { id: true, firstName: true, lastName: true } },
                },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    action: 'LAB_REPORT_CREATED',
                    resource: 'LAB_REPORT',
                    resourceId: created.id,
                    ipAddress,
                    userAgent,
                },
            });
            return created;
        });
        logger_1.default.info(`Lab report created: ${report.id}`);
        return this.formatLabReportResponse(report);
    }
    /**
     * Update lab report status
     */
    static async updateStatus(id, status, userId) {
        const updateData = { status };
        if (status === 'COMPLETED')
            updateData.completedAt = new Date();
        if (status === 'IN_PROGRESS')
            updateData.collectedAt = new Date();
        const report = await prisma_1.default.labReport.update({
            where: { id },
            data: updateData,
            include: {
                doctor: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        return this.formatLabReportResponse(report);
    }
    /**
     * Get patient lab reports
     */
    static async getPatientLabReports(patientId) {
        return prisma_1.default.labReport.findMany({
            where: { patientId },
            include: {
                doctor: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static formatLabReportResponse(l) {
        return {
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
        };
    }
}
exports.LabReportService = LabReportService;
//# sourceMappingURL=lab-reportService.js.map