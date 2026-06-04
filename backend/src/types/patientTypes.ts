import { PatientStatus, BloodGroup, Gender } from '@prisma/client';

// DTOs for API requests
export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceValidUntil?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  notes?: string;
  organizationId?: string;
  branchId?: string;
  primaryDoctorId?: string;
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceValidUntil?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  notes?: string;
  status?: PatientStatus;
  primaryDoctorId?: string;
}

export interface PatientQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  status?: PatientStatus;
  organizationId?: string;
  branchId?: string;
  primaryDoctorId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientResponse {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: Gender | null;
  bloodGroup: BloodGroup | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relation: string | null;
  } | null;
  insurance: {
    provider: string | null;
    policyNumber: string | null;
    validUntil: string | null;
  } | null;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  notes: string | null;
  status: PatientStatus;
  primaryDoctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  } | null;
  organization: {
    id: string;
    name: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  totalVisits: number;
  lastVisitDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientListResponse {
  patients: PatientResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newThisMonth: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  bloodGroupDistribution: Record<string, number>;
  ageDistribution: {
    child: number;    // 0-12
    teen: number;     // 13-19
    adult: number;    // 20-59
    senior: number;   // 60+
  };
  topConditions: Array<{ condition: string; count: number }>;
}

export interface BulkOperationResult {
  success: boolean;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  errors: Array<{ row: number; message: string }>;
}

export interface PatientDocumentDto {
  documentType: string;
  title: string;
  description?: string;
  file: Express.Multer.File;
}

export interface PatientDocumentResponse {
  id: string;
  patientId: string;
  documentType: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}