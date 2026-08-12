export interface VitalSigns {
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
  status: string;
  startDate: string;
  endDate: string | null;
  refillsAllowed: number;
  refillsUsed: number;
  isControlled: boolean;
  doctor: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface LabReportResponse {
  id: string;
  testName: string;
  testCategory: string | null;
  results: Record<string, unknown>;
  normalRanges: Record<string, unknown> | null;
  interpretation: string | null;
  status: string;
  orderedAt: string;
  collectedAt: string | null;
  completedAt: string | null;
  doctor: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface BlockchainRecordResponse {
  id: string;
  recordType: string;
  dataHash: string;
  txHash: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface EMRResponse {
  id: string;
  patient: { id: string; patientId: string; firstName: string; lastName: string; dateOfBirth: string | null; gender: string | null };
  doctor: { id: string; firstName: string; lastName: string; specialization: string | null };
  appointment: { id: string; appointmentId: string; appointmentDate: string; type: string } | null;
  chiefComplaint: string | null;
  diagnosis: string | null;
  icd10Codes: string[];
  symptoms: Record<string, unknown> | null;
  vitalSigns: VitalSigns | null;
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
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface EMRListResponse {
  success: boolean;
  status: number;
  records: EMRResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreateEMRRequest {
  patientId: string;
  appointmentId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  icd10Codes?: string[];
  vitalSigns?: VitalSigns;
  examinationNotes?: string;
  treatmentPlan?: string;
  doctorNotes?: string;
}

export interface CreatePrescriptionRequest {
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
}

export interface CreateLabReportRequest {
  medicalRecordId?: string;
  patientId: string;
  testName: string;
  testCategory?: string;
  results: Record<string, unknown>;
  interpretation?: string;
}
