import { Prisma } from '@prisma/client';
import { CreatePrescriptionInput } from '../validators/emrValidator';
import { PrescriptionResponse } from '../../../types/emrTypes';
export declare class PrescriptionService {
    /**
     * Create prescription
     */
    static createPrescription(data: CreatePrescriptionInput, userId: string, ipAddress: string, userAgent: string): Promise<PrescriptionResponse>;
    /**
     * Get patient prescriptions
     */
    static getPatientPrescriptions(patientId: string): Promise<({
        medicalRecord: {
            id: string;
        };
        doctor: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PrescriptionStatus;
        createdAt: Date;
        updatedAt: Date;
        route: string | null;
        patientId: string;
        createdById: string;
        doctorId: string;
        duration: string;
        startDate: Date;
        endDate: Date | null;
        drugName: string;
        medicalRecordId: string;
        genericName: string | null;
        dosage: string;
        frequency: string;
        quantity: string | null;
        instructions: string | null;
        refillsAllowed: number | null;
        isControlled: boolean;
        refillsUsed: number | null;
        drugInteractions: Prisma.JsonValue | null;
    })[]>;
    /**
     * Discontinue prescription
     */
    static discontinuePrescription(id: string, userId: string, ipAddress: string, userAgent: string): Promise<PrescriptionResponse>;
    private static checkDrugInteractions;
    private static formatPrescriptionResponse;
}
//# sourceMappingURL=prescriptionService.d.ts.map