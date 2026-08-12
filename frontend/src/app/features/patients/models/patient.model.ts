export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type BloodGroup = 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'DECEASED';

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
  emergencyContact: { name: string | null; phone: string | null; relation: string | null } | null;
  insurance: { provider: string | null; policyNumber: string | null; validUntil: string | null } | null;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  notes: string | null;
  status: PatientStatus;
  primaryDoctor: { id: string; firstName: string; lastName: string; specialization: string | null } | null;
  organization: { id: string; name: string } | null;
  branch: { id: string; name: string } | null;
  createdBy: { id: string; firstName: string; lastName: string } | null;
  totalVisits: number;
  lastVisitDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientRequest {
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
  primaryDoctorId?: string;
}

export type UpdatePatientRequest = Partial<CreatePatientRequest> & { status?: PatientStatus };

export interface PatientQuery {
  page?: number;
  limit?: number;
  search?: string;
  gender?: Gender;
  status?: PatientStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  newThisMonth: number;
  genderDistribution: { male: number; female: number; other: number };
  bloodGroupDistribution: Record<string, number>;
  ageDistribution: { child: number; teen: number; adult: number; senior: number };
  topConditions: { condition: string; count: number }[];
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
  uploadedBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export const GENDER_OPTIONS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];
export const BLOOD_GROUP_OPTIONS: BloodGroup[] = [
  'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
  'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE',
];
