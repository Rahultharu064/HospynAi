import { CurrentUser } from './user.model';

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

export interface ResetPasswordRequest {
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
