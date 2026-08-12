import { UserRole, UserStatus, AuthProvider } from '@prisma/client';

// DTOs for API requests
export interface RegisterUserDto {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role?: UserRole;
  organizationId?: string;
  branchId?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface LoginUserDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR';
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

export interface ResendOtpDto {
  email: string;
  type: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR';
  channel: 'EMAIL' | 'SMS';
}

// JWT Token Payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

// Auth Tokens Response
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// User Profile Response
export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  authProvider: AuthProvider;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  mfaEnabled: boolean;
  organizationId: string | null;
  branchId: string | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Google Profile from Passport
export interface GoogleProfile {
  id: string;
  displayName: string;
  name?: {
    familyName?: string;
    givenName?: string;
  };
  emails?: Array<{ value: string; verified: boolean }>;
  photos?: Array<{ value: string }>;
  provider: string;
}

// Auth Response
export interface AuthResponse {
  success: boolean;
  status: number;
  message: string;
  data?: any;
}

// Login Response Data
export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl: string | null;
    isEmailVerified?: boolean;
    organizationId?: string | null;
    branchId?: string | null;
  };
}

// Session Info
export interface SessionInfo {
  id: string;
  userId: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  lastActivity: Date;
  createdAt: Date;
}

// Audit Log Entry
export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

// Permission Types
export type Permission = 
  | 'MANAGE_ORGANIZATIONS'
  | 'MANAGE_USERS'
  | 'MANAGE_ROLES'
  | 'VIEW_ANALYTICS'
  | 'VIEW_FINANCIAL_REPORTS'
  | 'MANAGE_SYSTEM_SETTINGS'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_BLOCKCHAIN'
  | 'MANAGE_BRANCHES'
  | 'EXPORT_DATA'
  | 'MANAGE_INTEGRATIONS'
  | 'MANAGE_STAFF'
  | 'MANAGE_APPOINTMENTS'
  | 'MANAGE_PATIENTS'
  | 'VIEW_PATIENTS'
  | 'EDIT_EMR'
  | 'WRITE_PRESCRIPTIONS'
  | 'VIEW_OWN_SCHEDULE'
  | 'ACCESS_TELEMEDICINE'
  | 'ORDER_LAB_TESTS'
  | 'VIEW_LAB_RESULTS'
  | 'MANAGE_OWN_PATIENTS'
  | 'UPDATE_VITALS'
  | 'VIEW_SCHEDULE'
  | 'ASSIST_DOCTOR'
  | 'MANAGE_QUEUE'
  | 'UPDATE_PATIENT_STATUS'
  | 'BOOK_APPOINTMENTS'
  | 'REGISTER_PATIENTS'
  | 'MANAGE_WALK_INS'
  | 'VIEW_DOCTOR_AVAILABILITY'
  | 'VIEW_PRESCRIPTIONS'
  | 'MANAGE_INVENTORY'
  | 'DISPENSE_MEDICATION'
  | 'VIEW_PATIENT_HISTORY'
  | 'MANAGE_DRUG_STOCK'
  | 'UPLOAD_REPORTS'
  | 'MANAGE_LAB_EQUIPMENT'
  | 'UPDATE_TEST_RESULTS'
  | 'VIEW_PATIENT_SAMPLES'
  | 'VIEW_OWN_RECORDS'
  | 'MANAGE_OWN_PROFILE'
  | 'VIEW_OWN_PRESCRIPTIONS'
  | 'VIEW_OWN_LAB_RESULTS'
  | 'PAY_BILLS';