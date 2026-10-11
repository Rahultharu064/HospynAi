// =============================================================================
// HospynAI — Production Environment
// This file is used automatically when running: ng build --configuration production
// Angular swaps environment.ts → environment.production.ts at build time.
// =============================================================================

import { getRuntimeBoolean, getRuntimeString } from './runtime-config';

export const environment = {
  production: true,

  // ─── Backend API ───────────────────────────────────────────────────────────
  apiUrl: getRuntimeString('apiUrl', 'https://api.hospynai.com/api/v1'),
  socketUrl: getRuntimeString('socketUrl', 'https://api.hospynai.com'),

  // ─── App Metadata ──────────────────────────────────────────────────────────
  appName: getRuntimeString('appName', 'HospynAI'),
  appVersion: getRuntimeString('appVersion', '1.0.0'),

  // ─── Auth ──────────────────────────────────────────────────────────────────
  googleAuthUrl: getRuntimeString('googleAuthUrl', 'https://api.hospynai.com/api/v1/auth/google'),

  // ─── Feature Flags ─────────────────────────────────────────────────────────
  features: {
    blockchain: getRuntimeBoolean('blockchain', true),
    aiChat: getRuntimeBoolean('aiChat', true),
    voiceAgent: getRuntimeBoolean('voiceAgent', true),
  },

  // ─── Timeouts & Limits ─────────────────────────────────────────────────────
  httpTimeoutMs: 30000,
  refreshTokenBufferMs: 60000, // Refresh 60s before expiry
};
