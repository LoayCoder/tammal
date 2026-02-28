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

/** Hook point for external error reporting — routes to Sentry in production */
function reportError(_tag: string, message: string, extra?: unknown): void {
  if (import.meta.env.MODE === 'production') {
    try {
      const { Sentry } = await_sentry();
      if (Sentry) {
        Sentry.captureException(extra instanceof Error ? extra : new Error(`[${_tag}] ${message}`));
      }
    } catch {
      // Sentry not loaded — swallow silently
    }
  }
}

/** Lazy import to avoid pulling Sentry into dev bundles */
function await_sentry() {
  // Dynamic import is NOT used here to keep this synchronous.
  // Sentry is tree-shaken in dev because initSentry() is a no-op.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/react') as { Sentry: typeof import('@sentry/react') };
  } catch {
    return { Sentry: null };
  }
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
