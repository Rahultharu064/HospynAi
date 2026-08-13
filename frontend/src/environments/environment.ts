// =============================================================================
// HospynAI — Development Environment
// This file is used automatically when running: ng serve
// For production values, see environment.production.ts
// =============================================================================

export const environment = {
  production: false,

  // ─── Backend API ───────────────────────────────────────────────────────────
  apiUrl: 'http://localhost:5000/api/v1',
  socketUrl: 'http://localhost:5000',

  // ─── App Metadata ──────────────────────────────────────────────────────────
  appName: 'HospynAI',
  appVersion: '1.0.0',

  // ─── Auth ──────────────────────────────────────────────────────────────────
  googleAuthUrl: 'http://localhost:5000/api/v1/auth/google',

  // ─── Feature Flags ─────────────────────────────────────────────────────────
  features: {
    blockchain: true,
    aiChat: true,
    voiceAgent: true,
  },

  // ─── Timeouts & Limits ─────────────────────────────────────────────────────
  httpTimeoutMs: 30000,
  refreshTokenBufferMs: 60000, // Refresh 60s before expiry
};
