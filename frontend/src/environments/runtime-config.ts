export type RuntimeFeatureFlags = {
  blockchain?: boolean;
  aiChat?: boolean;
  voiceAgent?: boolean;
};

export type RuntimeAppConfig = {
  apiUrl?: string;
  socketUrl?: string;
  googleAuthUrl?: string;
  appName?: string;
  appVersion?: string;
  features?: RuntimeFeatureFlags;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeAppConfig;
  }
}

const getRuntimeConfig = (): RuntimeAppConfig => {
  if (typeof window === 'undefined') {
    return {};
  }

  return window.__APP_CONFIG__ ?? {};
};

export function getRuntimeString(
  key: keyof Pick<RuntimeAppConfig, 'apiUrl' | 'socketUrl' | 'googleAuthUrl' | 'appName' | 'appVersion'>,
  fallback: string
): string {
  const value = getRuntimeConfig()[key];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function getRuntimeBoolean(key: keyof RuntimeFeatureFlags, fallback: boolean): boolean {
  const value = getRuntimeConfig().features?.[key];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true';
  }

  return fallback;
}
