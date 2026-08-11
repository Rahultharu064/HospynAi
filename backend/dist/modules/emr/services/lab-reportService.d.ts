import { Prisma } from '@prisma/client';
import { CreateLabReportInput } from '../validators/emrValidator';
import { LabReportResponse } from '../../../types/emrTypes';
export declare class LabReportService {
    /**
     * Create lab report
     */
    static createLabReport(data: CreateLabReportInput, userId: string, ipAddress: string, userAgent: string): Promise<LabReportResponse>;
    /**
     * Update lab report status
     */
    static updateStatus(id: string, status: string, userId: string): Promise<LabReportResponse>;
    /**
     * Get patient lab reports
     */
    static getPatientLabReports(patientId: string): Promise<({
        doctor: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.LabReportStatus;
        createdAt: Date;
        updatedAt: Date;
        attachments: Prisma.JsonValue | null;
        patientId: string;
        createdById: string;
        doctorId: string;
        testName: string;
        medicalRecordId: string | null;
        testCategory: string | null;
        results: Prisma.JsonValue;
        normalRanges: Prisma.JsonValue | null;
        interpretation: string | null;
        orderedAt: Date;
        collectedAt: Date | null;
        completedAt: Date | null;
    })[]>;
    private static formatLabReportResponse;
}
//# sourceMappingURL=lab-reportService.d.ts.map