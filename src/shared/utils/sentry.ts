/**
 * Sentry initialization — production only.
 *
 * CRITICAL: Session Replay is fully disabled (sensitive mental-health data).
 * beforeSend strips PII, mood/crisis breadcrumbs, and request/response bodies.
 */
import * as Sentry from '@sentry/react';

const SENSITIVE_KEYWORDS = ['mood', 'comment', 'crisis', 'textarea', 'mental', 'checkin'];

function containsSensitive(str: string | undefined | null): boolean {
  if (!str) return false;
  const lower = str.toLowerCase();
  return SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (import.meta.env.MODE !== 'production' || !dsn) {
    return; // No-op outside production or without DSN
  }

  Sentry.init({
    dsn,
    environment: 'production',
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Performance — 20 % of transactions
    tracesSampleRate: 0.2,

    // Session Replay — FULLY DISABLED (sensitive data)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    beforeSend(event) {
      // ── Strip sensitive breadcrumbs ──
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.filter((bc) => {
          const msg = bc.message ?? bc.category ?? '';
          return !containsSensitive(msg);
        });
      }

      // ── Strip request / response bodies ──
      if (event.request) {
        delete event.request.data;
        delete (event.request as Record<string, unknown>).body;
      }

      // ── Strip PII from user context — keep only id ──
      if (event.user) {
        const id = event.user.id;
        event.user = id ? { id } : {};
      }

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      if (containsSensitive(breadcrumb.message) || containsSensitive(breadcrumb.category)) {
        return null; // drop entirely
      }
      return breadcrumb;
    },
  });
}

/** Re-export for use in ErrorBoundary / logger */
export { Sentry };

