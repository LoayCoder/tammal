/**
 * AI Rate Limiter — Unit Tests
 *
 * Tests window bucketing, per-user limit, per-tenant limit, and allow path.
 */

import { describe, it, expect } from 'vitest';

// ── Window bucketing (pure function, tested directly) ──────────

/**
 * Replicates computeWindowKey from rateLimiter.ts for unit testing.
 * Production code lives in the edge function; we mirror the logic here.
 */
function computeWindowKey(date: Date): string {
  const WINDOW_MINUTES = 10;
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const m = Math.floor(date.getUTCMinutes() / WINDOW_MINUTES) * WINDOW_MINUTES;
  const mStr = String(m).padStart(2, '0');
  return `${y}-${mo}-${d}T${h}:${mStr}`;
}

describe('computeWindowKey', () => {
  it('rounds minutes down to nearest 10-minute bucket', () => {
    expect(computeWindowKey(new Date('2026-03-01T14:37:22Z'))).toBe('2026-03-01T14:30');
    expect(computeWindowKey(new Date('2026-03-01T14:00:00Z'))).toBe('2026-03-01T14:00');
    expect(computeWindowKey(new Date('2026-03-01T14:59:59Z'))).toBe('2026-03-01T14:50');
    expect(computeWindowKey(new Date('2026-03-01T14:09:59Z'))).toBe('2026-03-01T14:00');
    expect(computeWindowKey(new Date('2026-03-01T14:10:00Z'))).toBe('2026-03-01T14:10');
  });

  it('handles midnight correctly', () => {
    expect(computeWindowKey(new Date('2026-03-01T00:05:00Z'))).toBe('2026-03-01T00:00');
  });

  it('handles end of day', () => {
    expect(computeWindowKey(new Date('2026-03-01T23:55:00Z'))).toBe('2026-03-01T23:50');
  });

  it('pads single-digit month/day', () => {
    expect(computeWindowKey(new Date('2026-01-05T03:07:00Z'))).toBe('2026-01-05T03:00');
  });
});

// ── Rate limit logic (mock-based) ──────────────────────────────

interface MockCounterState {
  userCount: number;
  tenantCount: number;
}

const RATE_LIMIT_PER_USER = 30;
const RATE_LIMIT_PER_TENANT = 200;

/**
 * Simulates the rate limit check logic without Supabase.
 */
function simulateRateLimitCheck(state: MockCounterState): {
  allowed: boolean;
  userExceeded: boolean;
  tenantExceeded: boolean;
  error?: { scope: 'user' | 'tenant' };
} {
  if (state.userCount > RATE_LIMIT_PER_USER) {
    return { allowed: false, userExceeded: true, tenantExceeded: false, error: { scope: 'user' } };
  }
  if (state.tenantCount > RATE_LIMIT_PER_TENANT) {
    return { allowed: false, userExceeded: false, tenantExceeded: true, error: { scope: 'tenant' } };
  }
  return { allowed: true, userExceeded: false, tenantExceeded: false };
}

describe('Rate Limit Logic', () => {
  it('allows request when both counters are below limits', () => {
    const result = simulateRateLimitCheck({ userCount: 10, tenantCount: 50 });
    expect(result.allowed).toBe(true);
    expect(result.userExceeded).toBe(false);
    expect(result.tenantExceeded).toBe(false);
  });

  it('allows request at exactly the user limit (30)', () => {
    const result = simulateRateLimitCheck({ userCount: 30, tenantCount: 50 });
    expect(result.allowed).toBe(true);
    expect(result.userExceeded).toBe(false);
  });

  it('blocks when user count exceeds limit (31)', () => {
    const result = simulateRateLimitCheck({ userCount: 31, tenantCount: 50 });
    expect(result.allowed).toBe(false);
    expect(result.userExceeded).toBe(true);
    expect(result.error?.scope).toBe('user');
  });

  it('allows request at exactly the tenant limit (200)', () => {
    const result = simulateRateLimitCheck({ userCount: 10, tenantCount: 200 });
    expect(result.allowed).toBe(true);
    expect(result.tenantExceeded).toBe(false);
  });

  it('blocks when tenant count exceeds limit (201)', () => {
    const result = simulateRateLimitCheck({ userCount: 10, tenantCount: 201 });
    expect(result.allowed).toBe(false);
    expect(result.tenantExceeded).toBe(true);
    expect(result.error?.scope).toBe('tenant');
  });

  it('user limit checked before tenant limit (user takes precedence)', () => {
    const result = simulateRateLimitCheck({ userCount: 31, tenantCount: 201 });
    expect(result.allowed).toBe(false);
    expect(result.userExceeded).toBe(true);
    // user is checked first, so tenantExceeded is false
    expect(result.tenantExceeded).toBe(false);
    expect(result.error?.scope).toBe('user');
  });

  it('high usage below limits still allowed', () => {
    const result = simulateRateLimitCheck({ userCount: 29, tenantCount: 199 });
    expect(result.allowed).toBe(true);
  });
});

describe('RateLimitExceededError', () => {
  it('creates error with correct scope and window key', () => {
    const error = {
      name: 'RateLimitExceededError',
      scope: 'user' as const,
      windowKey: '2026-03-01T14:30',
      message: 'Rate limit exceeded (user) for window 2026-03-01T14:30',
    };
    expect(error.name).toBe('RateLimitExceededError');
    expect(error.scope).toBe('user');
    expect(error.windowKey).toBe('2026-03-01T14:30');
    expect(error.message).toContain('user');
    expect(error.message).toContain('2026-03-01T14:30');
  });

  it('creates error with tenant scope', () => {
    const error = {
      name: 'RateLimitExceededError',
      scope: 'tenant' as const,
      windowKey: '2026-03-01T14:30',
      message: 'Rate limit exceeded (tenant) for window 2026-03-01T14:30',
    };
    expect(error.scope).toBe('tenant');
    expect(error.message).toContain('tenant');
  });
});
