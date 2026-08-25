import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActiveSession,
  AvatarUploadData,
  ChangePasswordRequest,
  CreateStaffRequest,
  CreateStaffResponseData,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseData,
  LoginResult,
  MeResponseData,
  RefreshResponseData,
  RegisterRequest,
  RegisterResponseData,
  ResendOtpRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  UpdatedProfileData,
  VerifyOtpRequest,
  VerifyOtpResult,
} from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { CurrentUser } from '../models/user.model';

const ACCESS_TOKEN_KEY = 'vmp_access_token';
const USER_KEY = 'vmp_user';
const PERMISSIONS_KEY = 'vmp_permissions';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private accessToken: string | null = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  private readonly _currentUser = signal<CurrentUser | null>(this.readStoredUser());
  private readonly _permissions = signal<readonly string[]>(this.readStoredPermissions());

  readonly currentUser = this._currentUser.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed(() => this._currentUser()?.role ?? null);

  private refreshInFlight: Observable<RefreshResponseData> | null = null;
  private http = inject(HttpClient);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Permission list is issued by GET /auth/me, so it is empty until that has been
   * called at least once in the session. Use `role()` for anything that must be
   * correct immediately after login; this is for finer-grained UI affordances.
   */
  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
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

  /**
   * Only EMAIL_VERIFICATION and TWO_FACTOR complete a sign-in and come back with a
   * session; PHONE_VERIFICATION and PASSWORD_RESET just confirm the code. This used
   * to store the session unconditionally, which wrote `undefined` as the access token
   * and a user-less session for the two flavours that don't issue one.
   */
  verifyOtp(payload: VerifyOtpRequest): Observable<ApiResponse<VerifyOtpResult>> {
    return this.http
      .post<ApiResponse<VerifyOtpResult>>(`${this.baseUrl}/verify-otp`, payload, { withCredentials: true })
      .pipe(
        tap((res) => {
          if ('accessToken' in res.data) {
            this.setSession(res.data);
          }
        })
      );
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

  /**
   * Unwraps the `{ user, permissions }` envelope the API returns and refreshes both
   * signals. Assigning the envelope straight into `currentUser` left `role`
   * undefined, which silently broke every role-gated view after a Google login.
   */
  getMe(): Observable<MeResponseData> {
    return this.http.get<ApiResponse<MeResponseData>>(`${this.baseUrl}/me`).pipe(
      map((res) => res.data),
      tap((data) => {
        this.updateCurrentUser(data.user);
        this.setPermissions(data.permissions);
      })
    );
  }

  /**
   * Completes a Google OAuth login. The backend redirect only carries the access
   * token (the refresh token already landed as an httpOnly cookie) — there's no
   * user payload to seed the session with, so this stores the token first and
   * fetches the profile via /me to populate currentUser.
   */
  completeGoogleLogin(accessToken: string): Observable<MeResponseData> {
    this.accessToken = accessToken;
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return this.getMe();
  }

  updateProfile(payload: UpdateProfileRequest): Observable<ApiResponse<UpdatedProfileData>> {
    return this.http
      .patch<ApiResponse<UpdatedProfileData>>(`${this.baseUrl}/profile`, payload)
      .pipe(tap((res) => this.updateCurrentUser(res.data)));
  }

  uploadAvatar(file: File): Observable<ApiResponse<AvatarUploadData>> {
    const form = new FormData();
    form.append('avatar', file);
    return this.http
      .post<ApiResponse<AvatarUploadData>>(`${this.baseUrl}/avatar`, form)
      .pipe(tap((res) => this.updateCurrentUser({ avatarUrl: res.data.avatarUrl })));
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

  /** Sign out everywhere — revokes every session and refresh token for the account. */
  logoutAll(): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/logout-all`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  /** "Where you're signed in" — the caller's own live sessions. */
  listSessions(): Observable<ActiveSession[]> {
    return this.http
      .get<ApiResponse<ActiveSession[]>>(`${this.baseUrl}/sessions`)
      .pipe(map((res) => res.data));
  }

  revokeSession(sessionId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.baseUrl}/sessions/${sessionId}`);
  }

  deactivateAccount(): Observable<ApiResponse<null>> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/deactivate`, {}, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  /**
   * Staff provisioning. Self-registration is PATIENT-only by design, so every
   * non-patient account is created here — the API enforces SUPER_ADMIN/ADMIN and
   * pins an ADMIN's staff to their own organization.
   */
  createStaff(payload: CreateStaffRequest): Observable<ApiResponse<CreateStaffResponseData>> {
    return this.http.post<ApiResponse<CreateStaffResponseData>>(`${this.baseUrl}/staff`, payload);
  }

  /** Clears local session state without calling the API (used after a failed refresh). */
  clearSession(): void {
    this.accessToken = null;
    this._currentUser.set(null);
    this._permissions.set([]);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(PERMISSIONS_KEY);
  }

  setSession(data: LoginResponseData): void {
    this.accessToken = data.accessToken;
    this._currentUser.set(data.user);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    // A fresh login says nothing about permissions — drop any list left over from a
    // previous account rather than carrying it across the switch.
    this.setPermissions([]);
  }

  updateCurrentUser(patch: Partial<CurrentUser>): void {
    const merged = { ...this._currentUser(), ...patch } as CurrentUser;
    this._currentUser.set(merged);
    sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  private setPermissions(permissions: readonly string[]): void {
    this._permissions.set(permissions);
    sessionStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
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

  private readStoredPermissions(): readonly string[] {
    const raw = sessionStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
}
