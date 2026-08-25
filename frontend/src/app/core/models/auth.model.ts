import { CurrentUser, UserProfile, UserRole, UserStatus } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponseData {
  accessToken: string;
  expiresIn: number;
  user: CurrentUser;
}

export interface RequiresVerificationData {
  requiresVerification: true;
  userId: string;
}

export type LoginResult = LoginResponseData | RequiresVerificationData;

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface RegisterResponseData {
  userId: string;
  email: string;
}

export type OtpType = 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR';

export interface VerifyOtpRequest {
  email: string;
  code: string;
  type: OtpType;
}

export interface ResendOtpRequest {
  email: string;
  type: OtpType;
  channel: 'EMAIL' | 'SMS';
}

export interface ForgotPasswordRequest {
  email: string;
}

/**
 * `email` scopes the reset code to one account. The API requires it — a code is only
 * looked up against the user it was issued to, so a request without an email is
 * rejected outright.
 */
export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RefreshResponseData {
  accessToken: string;
  expiresIn: number;
}

/**
 * GET /auth/me. The API wraps the profile in an envelope rather than returning the
 * user directly, so this must be unwrapped before it reaches `currentUser` —
 * assigning the envelope leaves `role` undefined and every role check fails open.
 */
export interface MeResponseData {
  user: UserProfile;
  permissions: string[];
}

/**
 * POST /auth/verify-otp with EMAIL_VERIFICATION or TWO_FACTOR completes a sign-in and
 * hands back a session exactly like /login. PHONE_VERIFICATION and PASSWORD_RESET
 * only confirm the code, so callers must narrow before assuming a session exists.
 */
export interface OtpVerifiedData {
  verified: true;
  isEmailVerified: boolean;
}

export type VerifyOtpResult = LoginResponseData | OtpVerifiedData;

/** GET /auth/sessions. The opaque session token is deliberately never sent to the client. */
export interface ActiveSession {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivity: string;
  expiresAt: string;
  createdAt: string;
  current: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
}

/**
 * PATCH /auth/profile echoes only the columns it touched — it is deliberately not a
 * full profile, so don't treat it as one.
 */
export interface UpdatedProfileData {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  updatedAt: string;
}

export interface AvatarUploadData {
  avatarUrl: string;
}

/** POST /auth/staff — privileged provisioning, SUPER_ADMIN and ADMIN only. */
export interface CreateStaffRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Exclude<UserRole, 'PATIENT'>;
  organizationId?: string;
  branchId?: string;
}

export interface CreateStaffResponseData {
  userId: string;
  email: string;
  role: UserRole;
}
