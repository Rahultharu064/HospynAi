import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  LoginResult,
  RefreshResponseData,
  RegisterRequest,
  RegisterResponseData,
  ResendOtpRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { CurrentUser, UserProfile } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'vmp_access_token';
const USER_KEY = 'vmp_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  private readonly _currentUser = signal<CurrentUser | null>(this.readStoredUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed(() => this._currentUser()?.role ?? null);

  private refreshInFlight: Observable<RefreshResponseData> | null = null;
  private http = inject(HttpClient);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  login(payload: LoginRequest): Observable<ApiResponse<LoginResult>> {
    return this.http
      .post<ApiResponse<LoginResult>>(`${this.baseUrl}/login`, payload, { withCredentials: true })
      .pipe(
        tap((res) => {
          if ('accessToken' in res.data) {
            this.setSession(res.data);
          }
        })
      );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<RegisterResponseData>> {
    return this.http.post<ApiResponse<RegisterResponseData>>(`${this.baseUrl}/register`, payload);
  }

  verifyOtp(payload: VerifyOtpRequest): Observable<ApiResponse<LoginResponseData>> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${this.baseUrl}/verify-otp`, payload, { withCredentials: true })
      .pipe(tap((res) => this.setSession(res.data)));
  }

  resendOtp(payload: ResendOtpRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/resend-otp`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/reset-password`, payload);
  }

  changePassword(payload: ChangePasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/change-password`, payload);
  }

  getMe(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.baseUrl}/me`);
  }

  updateProfile(payload: { firstName?: string; lastName?: string; phone?: string | null }): Observable<ApiResponse<UserProfile>> {
    return this.http
      .patch<ApiResponse<UserProfile>>(`${this.baseUrl}/profile`, payload)
      .pipe(tap((res) => this.updateCurrentUser(res.data)));
  }

  /** Multicasts to any requests that race into a 401 at the same time, so only one refresh call fires. */
  refreshToken(): Observable<RefreshResponseData> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.http
        .post<ApiResponse<RefreshResponseData>>(`${this.baseUrl}/refresh`, {}, { withCredentials: true })
        .pipe(
          map((res) => res.data),
          tap((data) => {
            this.accessToken = data.accessToken;
            sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
          }),
          finalize(() => (this.refreshInFlight = null)),
          shareReplay(1)
        );
    }
    return this.refreshInFlight;
  }

  logout(): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  /** Clears local session state without calling the API (used after a failed refresh). */
  clearSession(): void {
    this.accessToken = null;
    this._currentUser.set(null);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }

  setSession(data: LoginResponseData): void {
    this.accessToken = data.accessToken;
    this._currentUser.set(data.user);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  updateCurrentUser(patch: Partial<CurrentUser>): void {
    const merged = { ...this._currentUser(), ...patch } as CurrentUser;
    this._currentUser.set(merged);
    sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  private readStoredUser(): CurrentUser | null {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}
