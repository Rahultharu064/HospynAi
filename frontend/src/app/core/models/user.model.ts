export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'PHARMACIST'
  | 'LAB_TECHNICIAN'
  | 'PATIENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type AuthProvider = 'LOCAL' | 'GOOGLE' | 'FACEBOOK' | 'APPLE';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  isEmailVerified?: boolean;
  organizationId?: string | null;
  branchId?: string | null;
}

/** Mirrors the `user` half of the GET /auth/me envelope. */
export interface UserProfile extends CurrentUser {
  phone: string | null;
  status: UserStatus;
  authProvider: AuthProvider;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  updatedAt: string;
  organization: { id: string; name: string; slug: string } | null;
  branch: { id: string; name: string } | null;
  /** Count of the user's live sessions, used by the security section of Settings. */
  activeSessions: number;
}
