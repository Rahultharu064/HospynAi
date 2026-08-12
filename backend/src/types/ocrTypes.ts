// ============================================
// OCR DTOs
// ============================================

export interface ScanDocumentDto {
  patientId?: string;
  documentType: DocumentScanType;
  language?: string;
  preprocess?: boolean;
  extractFields?: boolean;
  confidenceThreshold?: number;
}

export interface ScanPrescriptionDto {
  patientId: string;
  doctorId?: string;
  language?: string;
}

export interface ScanLabReportDto {
  patientId: string;
  doctorId?: string;
  language?: string;
}

export interface ScanInsuranceCardDto {
  patientId: string;
  language?: string;
}

export interface VerifyOcrDataDto {
  ocrResultId: string;
  corrections: Record<string, any>;
  confirmed: boolean;
}

export interface OcrQueryDto {
  page?: number;
  limit?: number;
  patientId?: string;
  documentType?: DocumentScanType;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// ENUMS
// ============================================

export type DocumentScanType = 
  | 'PRESCRIPTION'
  | 'LAB_REPORT'
  | 'INSURANCE_CARD'
  | 'ID_PROOF'
  | 'MEDICAL_CERTIFICATE'
  | 'DISCHARGE_SUMMARY'
  | 'GENERIC';

export type OcrStatus = 
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REVIEW_NEEDED'
  | 'VERIFIED'
  | 'FAILED';

export type FieldExtractionType =
  | 'PATIENT_INFO'
  | 'PRESCRIPTION_DATA'
  | 'LAB_RESULTS'
  | 'INSURANCE_INFO'
  | 'DOCTOR_INFO'
  | 'MEDICATION_INFO';

// ============================================
// RESPONSE TYPES
// ============================================

export interface OcrResponse {
  id: string;
  patientId: string | null;
  documentType: DocumentScanType;
  fileName: string;
  fileUrl: string;
  status: OcrStatus;
  rawText: string | null;
  extractedData: ExtractedData | null;
  confidence: number;
  language: string;
  processingTime: number;
  corrections: Record<string, any> | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedData {
  patientInfo?: PatientInfo;
  prescriptionData?: PrescriptionData;
  labResults?: LabResults;
  insuranceInfo?: InsuranceInfo;
  doctorInfo?: DoctorInfo;
  rawFields: Record<string, any>;
}

export interface PatientInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  patientId: string | null;
  confidence: number;
}

export interface PrescriptionData {
  doctorName: string | null;
  doctorLicense: string | null;
  patientName: string | null;
  date: string | null;
  medications: ExtractedMedication[];
  diagnosis: string | null;
  instructions: string | null;
  confidence: number;
}

export interface ExtractedMedication {
  name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  quantity: string | null;
  route: string | null;
  confidence: number;
}

export interface LabResults {
  testName: string | null;
  testDate: string | null;
  patientName: string | null;
  results: ExtractedLabResult[];
  referenceRanges: Record<string, string> | null;
  interpretation: string | null;
  confidence: number;
}

export interface ExtractedLabResult {
  parameter: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  isAbnormal: boolean;
  confidence: number;
}

export interface InsuranceInfo {
  providerName: string | null;
  policyNumber: string | null;
  groupNumber: string | null;
  memberName: string | null;
  memberDob: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  coverageType: string | null;
  confidence: number;
}

export interface DoctorInfo {
  name: string | null;
  licenseNumber: string | null;
  specialization: string | null;
  hospital: string | null;
  phone: string | null;
  confidence: number;
}

export interface OcrListResponse {
  documents: OcrResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OcrStats {
  totalScanned: number;
  todayScanned: number;
  byType: Record<string, number>;
  averageConfidence: number;
  reviewNeeded: number;
  verified: number;
  failed: number;
  averageProcessingTime: number;
}

export interface OcrTemplateResponse {
  id: string;
  name: string;
  documentType: DocumentScanType;
  fields: OcrTemplateField[];
  isActive: boolean;
}

export interface OcrTemplateField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select';
  required: boolean;
  regex?: string;
  options?: string[];
  position?: { x: number; y: number; width: number; height: number };
}