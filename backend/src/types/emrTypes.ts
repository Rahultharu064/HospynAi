import { PrescriptionStatus, LabReportStatus } from '@prisma/client';

// ============================================
// EMR DTOs
// ============================================

export interface CreateEMRDto {
  patientId: string;
  appointmentId?: string;
  doctorId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  icd10Codes?: string[];
  symptoms?: Record<string, any>;
  vitalSigns?: VitalSignsDto;
  examinationNotes?: string;
  treatmentPlan?: string;
  doctorNotes?: string;
  status?: string;
}

export interface UpdateEMRDto {
  chiefComplaint?: string;
  diagnosis?: string;
  icd10Codes?: string[];
  symptoms?: Record<string, any>;
  vitalSigns?: VitalSignsDto;
  examinationNotes?: string;
  treatmentPlan?: string;
  doctorNotes?: string;
  status?: string;
}

export interface VitalSignsDto {
  temperature?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  height?: number;
  weight?: number;
  bmi?: number;
  painLevel?: number;
}

export interface CreatePrescriptionDto {
  medicalRecordId: string;
  patientId: string;
  drugName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity?: string;
  route?: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  refillsAllowed?: number;
  isControlled?: boolean;
}

export interface CreateLabReportDto {
  medicalRecordId?: string;
  patientId: string;
  doctorId?: string;
  testName: string;
  testCategory?: string;
  results: Record<string, any>;
  normalRanges?: Record<string, any>;
  interpretation?: string;
  status?: LabReportStatus;
}

export interface EMRQueryDto {
  page?: number;
  limit?: number;
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface EMRResponse {
  id: string;
  patient: {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string | null;
    gender: string | null;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
  appointment: {
    id: string;
    appointmentId: string;
    appointmentDate: string;
    type: string;
  } | null;
  chiefComplaint: string | null;
  diagnosis: string | null;
  icd10Codes: string[];
  symptoms: Record<string, any> | null;
  vitalSigns: VitalSignsDto | null;
  examinationNotes: string | null;
  treatmentPlan: string | null;
  doctorNotes: string | null;
  version: number;
  isLatestVersion: boolean;
  status: string;
  signedAt: string | null;
  signedBy: string | null;
  prescriptions: PrescriptionResponse[];
  labReports: LabReportResponse[];
  blockchainRecords: BlockchainRecordResponse[];
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionResponse {
  id: string;
  drugName: string;
  genericName: string | null;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string | null;
  route: string | null;
  instructions: string | null;
  status: PrescriptionStatus;
  startDate: string;
  endDate: string | null;
  refillsAllowed: number;
  refillsUsed: number;
  isControlled: boolean;
  drugInteractions: any | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface LabReportResponse {
  id: string;
  testName: string;
  testCategory: string | null;
  results: Record<string, any>;
  normalRanges: Record<string, any> | null;
  interpretation: string | null;
  attachments: any | null;
  status: LabReportStatus;
  orderedAt: string;
  collectedAt: string | null;
  completedAt: string | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export interface BlockchainRecordResponse {
  id: string;
  recordType: string;
  dataHash: string;
  txHash: string | null;
  blockNumber: number | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface EMRListResponse {
  records: EMRResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EMRStats {
  totalRecords: number;
  todayRecords: number;
  averageDiagnosisPerRecord: number;
  topDiagnoses: Array<{ code: string; description: string; count: number }>;
  topPrescribedDrugs: Array<{ drug: string; count: number }>;
  topLabTests: Array<{ test: string; count: number }>;
}