// =============================================================================
// HospynAI — Production Environment
// This file is used automatically when running: ng build --configuration production
// Angular swaps environment.ts → environment.production.ts at build time.
// =============================================================================

export const environment = {
  production: true,

  // ─── Backend API ───────────────────────────────────────────────────────────
  // TODO: Update to your deployed domain before launching
  apiUrl: 'https://api.hospynai.com/api/v1',
  socketUrl: 'https://api.hospynai.com',

  // ─── App Metadata ──────────────────────────────────────────────────────────
  appName: 'HospynAI',
  appVersion: '1.0.0',

  // ─── Auth ──────────────────────────────────────────────────────────────────
  googleAuthUrl: 'https://api.hospynai.com/api/v1/auth/google',

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
