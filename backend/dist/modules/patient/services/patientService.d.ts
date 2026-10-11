import { DocumentType } from '@prisma/client';
import { CreatePatientInput, UpdatePatientInput, PatientQueryInput } from '../validators/patientValidator';
import { PatientResponse, PatientListResponse, PatientStats, BulkOperationResult, PatientDocumentResponse } from '../../../types/patientTypes';
export declare class PatientService {
    /**
     * ============================================
     * CREATE PATIENT
     * ============================================
     */
    static createPatient(data: CreatePatientInput, userId: string, ipAddress: string, userAgent: string): Promise<PatientResponse>;
    /**
     * ============================================
     * GET PATIENT BY ID
     * ============================================
     */
    static getPatientById(id: string): Promise<PatientResponse>;
    /**
     * ============================================
     * GET PATIENT BY PATIENT ID (Public ID)
     * ============================================
     */
    static getPatientByPatientId(patientId: string): Promise<PatientResponse>;
    /**
     * ============================================
     * RESOLVE THE CLINICAL RECORD OF THE SIGNED-IN USER
     * ============================================
     *
     * A `User` row with role PATIENT and a `Patient` row are separate records with no
     * foreign key between them, so a patient who signs in has no way to reach their own
     * chart. Email is the only shared identifier both carry, so it is what we match on.
     *
     * This is an interim resolver. The durable fix is a nullable `userId` on `Patient`
     * populated at registration; until then a patient whose chart was filed under a
     * different address than the one they signed up with will not resolve.
     */
    static getPatientForUser(userId: string): Promise<PatientResponse>;
    /**
     * ============================================
     * LIST PATIENTS WITH FILTERING & PAGINATION
     * ============================================
     */
    static listPatients(query: PatientQueryInput): Promise<PatientListResponse>;
    /**
     * ============================================
     * UPDATE PATIENT
     * ============================================
     */
    static updatePatient(id: string, data: UpdatePatientInput, userId: string, ipAddress: string, userAgent: string): Promise<PatientResponse>;
    /**
     * ============================================
     * DELETE PATIENT (Soft Delete)
     * ============================================
     */
    static deletePatient(id: string, userId: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * ============================================
     * HARD DELETE PATIENT (Admin only)
     * ============================================
     */
    static hardDeletePatient(id: string, userId: string, ipAddress: string, userAgent: string): Promise<void>;
    /**
     * ============================================
     * BULK IMPORT PATIENTS
     * ============================================
     */
    static bulkImport(patients: CreatePatientInput[], userId: string, organizationId?: string, branchId?: string): Promise<BulkOperationResult>;
    /**
     * ============================================
     * PATIENT STATISTICS
     * ============================================
     */
    static getPatientStats(organizationId?: string): Promise<PatientStats>;
    /**
     * ============================================
     * PATIENT DOCUMENTS
     * ============================================
     */
    static uploadDocument(patientId: string, documentType: DocumentType, title: string, description: string | undefined, file: Express.Multer.File, userId: string): Promise<PatientDocumentResponse>;
    static getPatientDocuments(patientId: string): Promise<({
        uploadedBy: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        url: string;
        id: string;
        createdAt: Date;
        patientId: string;
        fileSize: number;
        documentType: import(".prisma/client").$Enums.DocumentType;
        title: string;
        description: string | null;
        fileName: string;
        mimeType: string;
        cloudinaryPublicId: string;
        uploadedById: string;
    })[]>;
    /**
     * ============================================
     * HELPER METHODS
     * ============================================
     */
    private static generatePatientId;
    private static checkDuplicatePatient;
    private static validateOrganization;
    private static validateBranch;
    private static validateDoctor;
    private static calculateAge;
    private static getPatientInclude;
    private static formatPatientResponse;
}
//# sourceMappingURL=patientService.d.ts.map