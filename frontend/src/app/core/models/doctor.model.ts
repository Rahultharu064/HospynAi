export interface DoctorSummary {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  specialization: string | null;
  consultationFee: number | null;
  availableForTelemed: boolean;
}
