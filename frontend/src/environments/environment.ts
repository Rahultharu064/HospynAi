// =============================================================================
// HospynAI — Development Environment
// This file is used automatically when running: ng serve
// For production values, see environment.production.ts
// =============================================================================

import { getRuntimeBoolean, getRuntimeString } from './runtime-config';

export const environment = {
  production: false,

  // ─── Backend API ───────────────────────────────────────────────────────────
  apiUrl: getRuntimeString('apiUrl', 'http://localhost:5000/api/v1'),
  socketUrl: getRuntimeString('socketUrl', 'http://localhost:5000'),

  // ─── App Metadata ──────────────────────────────────────────────────────────
  appName: getRuntimeString('appName', 'HospynAI'),
  appVersion: getRuntimeString('appVersion', '1.0.0'),

  // ─── Auth ──────────────────────────────────────────────────────────────────
  googleAuthUrl: getRuntimeString('googleAuthUrl', 'http://localhost:5000/api/v1/auth/google'),

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
