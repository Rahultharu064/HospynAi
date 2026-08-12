<<<<<<< Updated upstream
import { Prisma } from '@prisma/client';
import prisma from '../../../config/prisma';
import { AuditService } from '../../auth/services/auditService';
import { CreateLabReportInput } from '../validators/emrValidator';
import { NotFoundError } from '../../../utils/errors';
import { LabReportResponse } from '../../../types/emrTypes';
import logger from '../../../utils/logger';

export class LabReportService {
  /**
   * Create lab report
   */
  static async createLabReport(
    data: CreateLabReportInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<LabReportResponse> {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient || patient.deletedAt) throw new NotFoundError('Patient not found');

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.labReport.create({
        data: {
          medicalRecordId: data.medicalRecordId || null,
          patientId: data.patientId,
          doctorId: data.doctorId || userId,
          testName: data.testName,
          testCategory: data.testCategory || null,
          results: data.results,
          normalRanges: data.normalRanges || Prisma.JsonNull,
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

    logger.info(`Lab report created: ${report.id}`);
    return this.formatLabReportResponse(report);
  }

  /**
   * Update lab report status
   */
  static async updateStatus(
    id: string,
    status: string,
    userId: string
  ): Promise<LabReportResponse> {
    const updateData: any = { status };
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'IN_PROGRESS') updateData.collectedAt = new Date();

    const report = await prisma.labReport.update({
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
  static async getPatientLabReports(patientId: string) {
    return prisma.labReport.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private static formatLabReportResponse(l: any): LabReportResponse {
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
=======
import prisma from '../../../config/prisma';
import { AuditService } from '../../auth/services/auditService';
import { CreateLabReportInput } from '../validators/emrValidator';
import { NotFoundError } from '../../../utils/errors';
import { LabReportResponse } from '../../../types/emrTypes';
import logger from '../../../utils/logger';

export class LabReportService {
  /**
   * Create lab report
   */
  static async createLabReport(
    data: CreateLabReportInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<LabReportResponse> {
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });
    if (!patient || patient.deletedAt) throw new NotFoundError('Patient not found');

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.labReport.create({
        data: {
          medicalRecordId: data.medicalRecordId || null,
          patientId: data.patientId,
          doctorId: data.doctorId || userId,
          testName: data.testName,
          testCategory: data.testCategory || null,
          results: data.results,
          normalRanges: data.normalRanges || null,
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

    logger.info(`Lab report created: ${report.id}`);
    return this.formatLabReportResponse(report);
  }

  /**
   * Update lab report status
   */
  static async updateStatus(
    id: string,
    status: string,
    userId: string
  ): Promise<LabReportResponse> {
    const updateData: any = { status };
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'IN_PROGRESS') updateData.collectedAt = new Date();

    const report = await prisma.labReport.update({
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
  static async getPatientLabReports(patientId: string) {
    return prisma.labReport.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private static formatLabReportResponse(l: any): LabReportResponse {
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
>>>>>>> Stashed changes
}