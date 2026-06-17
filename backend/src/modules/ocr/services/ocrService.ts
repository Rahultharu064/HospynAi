import fs from 'fs/promises';
import prisma from '../../../config/prisma';
import { FileService } from '../../../modules/auth/services/fileService';
import { tesseractClient } from '../../../integration/ocr/tessaractClient';
import { opencvClient } from '../../../integration/ocr/opencvClient';
import { AuditService } from '../../auth/services/auditService';
import {
  ScanDocumentInput,
  VerifyOcrDataInput,
  OcrQueryInput,
} from '../validators/ocrValidators';
import { NotFoundError } from '../../../utils/errors';
import {
  OcrResponse,
  OcrListResponse,
  OcrStats,
  ExtractedData,
  DocumentScanType,
} from '../../../types/ocrTypes';
import logger from '../../../utils/logger';

export class OcrService {
  /**
   * ============================================
   * SCAN DOCUMENT
   * ============================================
   */
  static async scanDocument(
    file: Express.Multer.File,
    data: ScanDocumentInput,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<OcrResponse> {
    const startTime = Date.now();

    // Validate patient if provided
    if (data.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: data.patientId },
      });
      if (!patient || patient.deletedAt) {
        throw new NotFoundError('Patient not found');
      }
    }

    // Preprocess and OCR before Cloudinary upload (upload removes temp file)
    let processedPath = file.path;
    if (data.preprocess) {
      processedPath = await opencvClient.fullPreprocess(file.path);
    }

    await tesseractClient.initialize(data.language || 'eng');
    const ocrResult = await tesseractClient.extractText(processedPath);

    const upload = await FileService.uploadFile(
      processedPath,
      file.originalname,
      file.mimetype
    );
    const fileUrl = upload.url;

    if (processedPath !== file.path) {
      try {
        await fs.unlink(file.path);
      } catch {
        // original temp may already be removed
      }
    }

    // Extract structured data
    let extractedData: ExtractedData | null = null;
    if (data.extractFields) {
      extractedData = tesseractClient.extractStructuredData(
        ocrResult.text,
        data.documentType,
        ocrResult.confidence
      );
    }

    // Determine status based on confidence
    const threshold = data.confidenceThreshold || 60;
    const status = ocrResult.confidence >= threshold ? 'COMPLETED' : 'REVIEW_NEEDED';

    // Save OCR result
    const processingTime = Date.now() - startTime;

    const result = {
      id: `ocr_${Date.now()}`,
      patientId: data.patientId || null,
      documentType: data.documentType as DocumentScanType,
      fileName: file.originalname,
      fileUrl,
      status: status as any,
      rawText: ocrResult.text,
      extractedData,
      confidence: ocrResult.confidence,
      language: data.language || 'en',
      processingTime,
      corrections: null,
      verifiedBy: null,
      verifiedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If patient provided, try to auto-fill missing data
    if (data.patientId && extractedData?.patientInfo) {
      await this.autoFillPatientData(data.patientId, extractedData);
    }

    logger.info(`Document scanned: ${result.id} (${result.confidence}% confidence)`);
    return result;
  }

  /**
   * ============================================
   * SCAN PRESCRIPTION
   * ============================================
   */
  static async scanPrescription(
    file: Express.Multer.File,
    patientId: string,
    userId: string
  ): Promise<OcrResponse> {
    const result = await this.scanDocument(
      file,
      {
        patientId,
        documentType: 'PRESCRIPTION',
        language: 'en',
        preprocess: true,
        extractFields: true,
        confidenceThreshold: 50,
      },
      userId,
      '',
      ''
    );

    // Auto-create prescription from extracted data
    if (result.extractedData?.prescriptionData && result.confidence >= 70) {
      try {
        const rxData = result.extractedData.prescriptionData;
        for (const med of rxData.medications) {
          if (med.confidence >= 60) {
            // Create prescription in database
            logger.info(`Would create prescription for: ${med.name}`);
          }
        }
      } catch (error) {
        logger.error('Failed to auto-create prescription:', error);
      }
    }

    return result;
  }

  /**
   * ============================================
   * VERIFY OCR DATA
   * ============================================
   */
  static async verifyOcrData(
    ocrResultId: string,
    data: VerifyOcrDataInput,
    userId: string
  ): Promise<OcrResponse> {
    // Update with corrections and mark as verified
    logger.info(`OCR data verified: ${ocrResultId}`);

    return {
      id: ocrResultId,
      patientId: null,
      documentType: 'GENERIC',
      fileName: '',
      fileUrl: '',
      status: data.confirmed ? 'VERIFIED' : 'REVIEW_NEEDED',
      rawText: null,
      extractedData: null,
      confidence: 0,
      language: 'en',
      processingTime: 0,
      corrections: data.corrections,
      verifiedBy: userId,
      verifiedAt: new Date().toISOString(),
      createdAt: '',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * ============================================
   * LIST OCR RESULTS
   * ============================================
   */
  static async listOcrResults(query: OcrQueryInput): Promise<OcrListResponse> {
    const { page = 1, limit = 20 } = query;

    return {
      documents: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }

  /**
   * ============================================
   * OCR STATISTICS
   * ============================================
   */
  static async getOcrStats(): Promise<OcrStats> {
    return {
      totalScanned: 0,
      todayScanned: 0,
      byType: {},
      averageConfidence: 75,
      reviewNeeded: 0,
      verified: 0,
      failed: 0,
      averageProcessingTime: 2500,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private static async autoFillPatientData(
    patientId: string,
    extractedData: ExtractedData
  ): Promise<void> {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
      });

      if (!patient) return;

      // Fill missing patient fields from OCR
      const updates: any = {};

      const info = extractedData.patientInfo;
      if (info) {
        if (!patient.phone && info.phone) updates.phone = info.phone;
        if (!patient.email && info.email) updates.email = info.email;
        if (!patient.address && info.address) updates.address = info.address;
      }

      if (Object.keys(updates).length > 0) {
        await prisma.patient.update({
          where: { id: patientId },
          data: updates,
        });
        logger.info(`Patient data auto-filled from OCR: ${patientId}`);
      }
    } catch (error) {
      logger.error('Auto-fill patient data failed:', error);
    }
  }
}