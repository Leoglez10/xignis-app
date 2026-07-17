import * as CapacitorSentry from "@sentry/capacitor";
import * as ReactSentry from "@sentry/react";

export function initializeMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  CapacitorSentry.init({ dsn, enabled: import.meta.env.PROD, environment: import.meta.env.MODE, release: `xignis@${__APP_VERSION__}`, sendDefaultPii: false }, ReactSentry.init);
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  CapacitorSentry.captureException(error, context ? { extra: context } : undefined);
}
