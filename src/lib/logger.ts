/**
 * Production-safe logger.
 *
 * Rules:
 *  - debug() only fires in DEV (import.meta.env.DEV)
 *  - warn() and error() always fire (observable in prod)
 *  - NEVER log auth tokens, PII, or full Supabase responses
 *  - All messages are prefixed with a tag for grep-ability
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('MyComponent', 'mounting with id', id);
 *   logger.warn('MyHook', 'RLS blocked query');
 *   logger.error('MyService', 'insert failed', error);
 *
 * Future: swap console calls for an external reporter by editing
 * the `reportError` function below — no other file changes needed.
 */

function formatTag(tag: string): string {
  return `[${tag}]`;
}

/** Optional hook point for external error reporting (Sentry, LogRocket, etc.) */
function reportError(_tag: string, _message: string, _extra?: unknown): void {
  // No-op by default.  Replace body with SDK call when ready.
  // e.g. Sentry.captureException(extra instanceof Error ? extra : new Error(message));
}

export const logger = {
  /** Development-only — stripped in production builds */
  debug(tag: string, ...args: unknown[]): void {
    if (import.meta.env.DEV) {
      console.log(formatTag(tag), ...args);
    }
  },

  /** Always emitted — useful for expected degraded paths */
  warn(tag: string, ...args: unknown[]): void {
    console.warn(formatTag(tag), ...args);
  },

  /** Always emitted — for genuine errors */
  error(tag: string, message: string, extra?: unknown): void {
    console.error(formatTag(tag), message, extra instanceof Error ? extra.message : extra ?? '');
    reportError(tag, message, extra);
  },
} as const;
