<<<<<<< Updated upstream
import { Prisma } from '@prisma/client';
import prisma from '../../../config/prisma';
import { AuditService } from '../../auth/services/auditService';
import { CreatePrescriptionInput } from '../validators/emrValidator';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { PrescriptionResponse } from '../../../types/emrTypes';
import logger from '../../../utils/logger';

export class PrescriptionService {
  /**
   * Create prescription
   */
  static async createPrescription(
    data: CreatePrescriptionInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PrescriptionResponse> {
    // Validate medical record
    const emr = await prisma.medicalRecord.findUnique({
      where: { id: data.medicalRecordId },
    });
    if (!emr) throw new NotFoundError('Medical record not found');
    if (emr.patientId !== data.patientId) {
      throw new BadRequestError('Patient mismatch');
    }

    // Check for drug interactions (simplified)
    const existingPrescriptions = await prisma.prescription.findMany({
      where: {
        patientId: data.patientId,
        status: 'ACTIVE',
      },
      select: { drugName: true, genericName: true },
    });

    const drugInteractions = this.checkDrugInteractions(
      data.drugName,
      existingPrescriptions
    );

    const prescription = await prisma.$transaction(async (tx) => {
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
          drugInteractions: drugInteractions.length > 0 ? drugInteractions : Prisma.JsonNull,
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

    logger.info(`Prescription created: ${prescription.id}`);
    return this.formatPrescriptionResponse(prescription);
  }

  /**
   * Get patient prescriptions
   */
  static async getPatientPrescriptions(patientId: string) {
    return prisma.prescription.findMany({
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
  static async discontinuePrescription(
    id: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PrescriptionResponse> {
    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundError('Prescription not found');

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status: 'DISCONTINUED' },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return this.formatPrescriptionResponse(updated);
  }

  // Drug interaction checker (simplified)
  private static checkDrugInteractions(
    newDrug: string,
    existingPrescriptions: Array<{ drugName: string; genericName: string | null }>
  ): string[] {
    // In production, this would check against a drug interaction database
    return [];
  }

  private static formatPrescriptionResponse(p: any): PrescriptionResponse {
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
=======
import prisma from '../../../config/prisma';
import { AuditService } from '../../auth/services/auditService';
import { CreatePrescriptionInput } from '../validators/emrValidator';
import { BadRequestError, NotFoundError } from '../../../utils/errors';
import { PrescriptionResponse } from '../../../types/emrTypes';
import logger from '../../../utils/logger';

export class PrescriptionService {
  /**
   * Create prescription
   */
  static async createPrescription(
    data: CreatePrescriptionInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PrescriptionResponse> {
    // Validate medical record
    const emr = await prisma.medicalRecord.findUnique({
      where: { id: data.medicalRecordId },
    });
    if (!emr) throw new NotFoundError('Medical record not found');
    if (emr.patientId !== data.patientId) {
      throw new BadRequestError('Patient mismatch');
    }

    // Check for drug interactions (simplified)
    const existingPrescriptions = await prisma.prescription.findMany({
      where: {
        patientId: data.patientId,
        status: 'ACTIVE',
      },
      select: { drugName: true, genericName: true },
    });

    const drugInteractions = this.checkDrugInteractions(
      data.drugName,
      existingPrescriptions
    );

    const prescription = await prisma.$transaction(async (tx) => {
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

    logger.info(`Prescription created: ${prescription.id}`);
    return this.formatPrescriptionResponse(prescription);
  }

  /**
   * Get patient prescriptions
   */
  static async getPatientPrescriptions(patientId: string) {
    return prisma.prescription.findMany({
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
  static async discontinuePrescription(
    id: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PrescriptionResponse> {
    const prescription = await prisma.prescription.findUnique({ where: { id } });
    if (!prescription) throw new NotFoundError('Prescription not found');

    const updated = await prisma.prescription.update({
      where: { id },
      data: { status: 'DISCONTINUED' },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return this.formatPrescriptionResponse(updated);
  }

  // Drug interaction checker (simplified)
  private static checkDrugInteractions(
    newDrug: string,
    existingPrescriptions: Array<{ drugName: string; genericName: string | null }>
  ): string[] {
    // In production, this would check against a drug interaction database
    return [];
  }

  private static formatPrescriptionResponse(p: any): PrescriptionResponse {
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
>>>>>>> Stashed changes
}