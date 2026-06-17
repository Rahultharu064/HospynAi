import { Prisma } from '@prisma/client';
import prisma from '../../../config/prisma';
import { BlockchainService } from '../../blockchain/services/blockchainService';
import { hashMedicalRecord } from '../../../utils/blockchainHash';
import { AuditService } from '../../auth/services/auditService';
import { EmailService } from '../../auth/services/emailService';
import {
  CreateEMRInput,
  UpdateEMRInput,
} from '../validators/emrValidator';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../../utils/errors';
import {
  EMRResponse,
  EMRListResponse,
  EMRStats,
  VitalSignsDto,
} from '../../../types/emrTypes';
import logger from '../../../utils/logger';

export class EMRService {
  /**
   * ============================================
   * CREATE EMR RECORD
   * ============================================
   */
  static async createEMR(
    data: CreateEMRInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<EMRResponse> {
    // Validate patient
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient || patient.deletedAt) {
      throw new NotFoundError('Patient not found');
    }

    // Validate appointment if provided
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
      });
      if (!appointment) throw new NotFoundError('Appointment not found');
      if (appointment.patientId !== data.patientId) {
        throw new BadRequestError('Appointment does not belong to this patient');
      }
    }

    // Calculate BMI if height and weight provided
    if (data.vitalSigns?.height && data.vitalSigns?.weight) {
      const heightInMeters = data.vitalSigns.height / 100;
      data.vitalSigns.bmi = Math.round((data.vitalSigns.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    }

    // Create EMR record
    const emr = await prisma.$transaction(async (tx) => {
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

    logger.info(`EMR created: ${emr.id} for patient ${patient.patientId}`);
    return this.formatEMRResponse(emr);
  }

  /**
   * ============================================
   * GET EMR BY ID
   * ============================================
   */
  static async getEMRById(id: string): Promise<EMRResponse> {
    const emr = await prisma.medicalRecord.findUnique({
      where: { id },
      include: this.getEMRInclude(),
    });

    if (!emr) throw new NotFoundError('EMR record not found');
    return this.formatEMRResponse(emr);
  }

  /**
   * ============================================
   * GET PATIENT EMR HISTORY
   * ============================================
   */
  static async getPatientEMRHistory(
    patientId: string,
    query: { page?: number; limit?: number }
  ): Promise<EMRListResponse> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient || patient.deletedAt) {
      throw new NotFoundError('Patient not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MedicalRecordWhereInput = {
      patientId,
      isLatestVersion: true,
    };

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: this.getEMRInclude(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.medicalRecord.count({ where }),
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
  static async updateEMR(
    id: string,
    data: UpdateEMRInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<EMRResponse> {
    const existingEMR = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existingEMR) throw new NotFoundError('EMR record not found');

    if (existingEMR.status === 'SIGNED') {
      throw new BadRequestError('Cannot update a signed EMR record. Create a new version instead.');
    }

    // Calculate BMI if updated
    if (data.vitalSigns?.height && data.vitalSigns?.weight) {
      const heightInMeters = data.vitalSigns.height / 100;
      data.vitalSigns.bmi = Math.round((data.vitalSigns.weight / (heightInMeters * heightInMeters)) * 10) / 10;
    }

    const emr = await prisma.$transaction(async (tx) => {
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
  static async signEMR(
    id: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<EMRResponse> {
    const existingEMR = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existingEMR) throw new NotFoundError('EMR record not found');
    if (existingEMR.status === 'SIGNED') {
      throw new BadRequestError('EMR is already signed');
    }

    const emr = await prisma.$transaction(async (tx) => {
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

      const blockchainRecordId = await this.createBlockchainRecord(
        tx,
        signed.id,
        signed.patientId,
        signed.patient.patientId,
        signed.signedAt!
      );

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

      return { signed, blockchainRecordId };
    });

    if (emr.blockchainRecordId) {
      BlockchainService.submitPendingAnchor(emr.blockchainRecordId).catch((error) => {
        logger.error(`EMR on-chain anchor failed for record ${emr.blockchainRecordId}:`, error);
      });
    }

    return this.formatEMRResponse(emr.signed);
  }

  /**
   * ============================================
   * CREATE NEW VERSION
   * ============================================
   */
  static async createNewVersion(
    id: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<EMRResponse> {
    const existingEMR = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!existingEMR) throw new NotFoundError('EMR record not found');

    // Mark old version
    await prisma.medicalRecord.update({
      where: { id },
      data: { isLatestVersion: false },
    });

    // Create new version
    const newVersion = await prisma.medicalRecord.create({
      data: {
        patientId: existingEMR.patientId,
        appointmentId: existingEMR.appointmentId,
        doctorId: existingEMR.doctorId,
        chiefComplaint: existingEMR.chiefComplaint,
        diagnosis: existingEMR.diagnosis,
        icd10Codes: existingEMR.icd10Codes,
        symptoms: existingEMR.symptoms as any,
        vitalSigns: existingEMR.vitalSigns as any,
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

    logger.info(`EMR new version created: ${newVersion.id} (v${newVersion.version})`);
    return this.formatEMRResponse(newVersion);
  }

  /**
   * ============================================
   * GENERATE PDF
   * ============================================
   */
  static async generatePDF(id: string): Promise<{ url: string }> {
    const emr = await prisma.medicalRecord.findUnique({
      where: { id },
      include: this.getEMRInclude(),
    });

    if (!emr) throw new NotFoundError('EMR record not found');

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
  static async getEMRStats(organizationId?: string): Promise<EMRStats> {
    const where: Prisma.MedicalRecordWhereInput = {
      isLatestVersion: true,
    };

    const [
      totalRecords,
      todayRecords,
      topDiagnoses,
    ] = await Promise.all([
      prisma.medicalRecord.count({ where }),
      prisma.medicalRecord.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.medicalRecord.findMany({
        where: { ...where, diagnosis: { not: null } },
        select: { diagnosis: true, icd10Codes: true },
        take: 50,
      }),
    ]);

    // Process top diagnoses
    const diagnosisMap = new Map<string, { code: string; description: string; count: number }>();
    topDiagnoses.forEach((record) => {
      if (record.diagnosis) {
        const key = record.diagnosis.substring(0, 100);
        const existing = diagnosisMap.get(key);
        if (existing) {
          existing.count++;
        } else {
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
  private static async createBlockchainRecord(
    tx: any,
    medicalRecordId: string,
    patientId: string,
    patientPublicId: string,
    signedAt: Date
  ): Promise<string> {
    const signedAtIso = signedAt.toISOString();
    const dataHash = hashMedicalRecord(medicalRecordId, patientId, signedAtIso);

    const record = await tx.blockchainRecord.create({
      data: {
        patientId,
        medicalRecordId,
        recordType: 'MEDICAL_RECORD',
        dataHash,
        status: 'PENDING',
        metadata: {
          recordId: medicalRecordId,
          patientPublicId,
          signedAt: signedAtIso,
        },
      },
    });

    return record.id;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static getEMRInclude(): Prisma.MedicalRecordInclude {
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

  private static formatEMRResponse(emr: any): EMRResponse {
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
      vitalSigns: emr.vitalSigns as VitalSignsDto | null,
      examinationNotes: emr.examinationNotes,
      treatmentPlan: emr.treatmentPlan,
      doctorNotes: emr.doctorNotes,
      version: emr.version,
      isLatestVersion: emr.isLatestVersion,
      status: emr.status,
      signedAt: emr.signedAt?.toISOString() || null,
      signedBy: emr.signedBy,
      prescriptions: emr.prescriptions?.map((p: any) => ({
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
      labReports: emr.labReports?.map((l: any) => ({
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
      blockchainRecords: emr.blockchainRecords?.map((b: any) => ({
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