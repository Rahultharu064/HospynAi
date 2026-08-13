import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * EnvironmentService
 *
 * Single source of truth for all environment-driven configuration.
 * Inject this service instead of importing `environment` directly in components or services.
 * This makes it trivial to mock in tests and swap configs without touching business logic.
 */
@Injectable({ providedIn: 'root' })
export class EnvironmentService {
  /** Whether the app is running in production mode */
  readonly isProduction = environment.production;

  /** Application name */
  readonly appName = environment.appName;

  /** Application version */
  readonly appVersion = environment.appVersion;

  // ─── API ───────────────────────────────────────────────────────────────────

  /** Full base URL of the REST API, e.g. http://localhost:5000/api/v1 */
  readonly apiUrl = environment.apiUrl;

  /** Root URL of the backend server (used for Socket.IO) */
  readonly socketUrl = environment.socketUrl;

  /** URL to initiate Google OAuth flow */
  readonly googleAuthUrl = environment.googleAuthUrl;

  // ─── Feature Flags ─────────────────────────────────────────────────────────

  /** Whether blockchain features (anchoring records, etc.) are enabled */
  readonly isBlockchainEnabled = environment.features.blockchain;

  /** Whether the AI chat assistant feature is enabled */
  readonly isAiChatEnabled = environment.features.aiChat;

  /** Whether the Twilio voice agent feature is enabled */
  readonly isVoiceEnabled = environment.features.voiceAgent;

  // ─── Timing ────────────────────────────────────────────────────────────────

  /** Global HTTP request timeout in milliseconds */
  readonly httpTimeoutMs = environment.httpTimeoutMs;

  /** How many ms before JWT expiry to proactively refresh the token */
  readonly refreshTokenBufferMs = environment.refreshTokenBufferMs;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Build a full API endpoint path, e.g. getEndpoint('auth/login') → 'http://…/api/v1/auth/login' */
  getEndpoint(path: string): string {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    return `${this.apiUrl}/${clean}`;
  }
}
