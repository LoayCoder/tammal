/**
 * useCheckinSubmit — Hook Contract Tests
 *
 * Validates:
 * - Mutation success flow + cache invalidation
 * - Idempotency (alreadySubmitted) path
 * - Error flow
 * - Targeted invalidation (no global invalidateQueries)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mock dependencies ──
const mockSubmitMoodEntry = vi.fn();
const mockToastInfo = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/services/checkinService', () => ({
  submitMoodEntry: (...args: unknown[]) => mockSubmitMoodEntry(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    info: (...args: unknown[]) => mockToastInfo(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key }),
}));

import { useCheckinSubmit } from '@/hooks/checkin/useCheckinSubmit';
import type { CheckinParams } from '@/services/checkinService';

const makeParams = (overrides?: Partial<CheckinParams>): CheckinParams => ({
  tenantId: 't1',
  employeeId: 'e1',
  userId: 'u1',
  moodLevel: 'good',
  moodScore: 4,
  currentStreak: 2,
  entryDate: '2026-02-28',
  ...overrides,
});

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Spy on invalidateQueries
  const origInvalidate = qc.invalidateQueries.bind(qc);
  const invalidateSpy = vi.fn((...args: Parameters<typeof qc.invalidateQueries>) => origInvalidate(...args));
  qc.invalidateQueries = invalidateSpy;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);

  return { wrapper, invalidateSpy };
}

describe('useCheckinSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Success flow ──

  it('returns result and invalidates correct caches on success', async () => {
    const result = { tip: 'Stay hydrated', pointsEarned: 20, newStreak: 3, alreadySubmitted: false };
    mockSubmitMoodEntry.mockResolvedValue(result);
    const { wrapper, invalidateSpy } = createWrapper();

    const { result: hook } = renderHook(() => useCheckinSubmit(), { wrapper });

    let submitResult: unknown;
    await act(async () => {
      submitResult = await hook.current.submitCheckin(makeParams());
    });

    expect(submitResult).toEqual(result);
    expect(hook.current.isSubmitting).toBe(false);
    expect(hook.current.error).toBeNull();

    // Verify targeted invalidation
    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c: [{ queryKey: string[] }]) => c[0].queryKey[0],
    );
    expect(invalidatedKeys).toContain('gamification');
    expect(invalidatedKeys).toContain('mood-entry-today');
    expect(invalidatedKeys).toContain('points-transactions');
    // Exactly 3 invalidations — no global blast
    expect(invalidateSpy).toHaveBeenCalledTimes(3);
  });

  // ── Idempotency ──

  it('shows info toast and skips invalidation when alreadySubmitted', async () => {
    mockSubmitMoodEntry.mockResolvedValue({ alreadySubmitted: true, tip: '', pointsEarned: 0, newStreak: 2 });
    const { wrapper, invalidateSpy } = createWrapper();

    const { result: hook } = renderHook(() => useCheckinSubmit(), { wrapper });

    await act(async () => {
      await hook.current.submitCheckin(makeParams());
    });

    expect(mockToastInfo).toHaveBeenCalledTimes(1);
    // No cache invalidation when already submitted
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  // ── Error flow ──

  it('sets error state and shows toast on failure', async () => {
    mockSubmitMoodEntry.mockRejectedValue(new Error('Network failure'));
    const { wrapper } = createWrapper();

    const { result: hook } = renderHook(() => useCheckinSubmit(), { wrapper });

    let submitResult: unknown;
    await act(async () => {
      submitResult = await hook.current.submitCheckin(makeParams());
    });

    expect(submitResult).toBeNull();
    expect(hook.current.error).toBe('Network failure');
    expect(mockToastError).toHaveBeenCalledWith('Network failure');
    expect(hook.current.isSubmitting).toBe(false);
  });

  it('uses fallback error message for non-Error throws', async () => {
    mockSubmitMoodEntry.mockRejectedValue('raw string error');
    const { wrapper } = createWrapper();

    const { result: hook } = renderHook(() => useCheckinSubmit(), { wrapper });

    await act(async () => {
      await hook.current.submitCheckin(makeParams());
    });

    // Falls back to t('common.error')
    expect(hook.current.error).toBe('common.error');
  });

  // ── Loading state ──

  it('sets isSubmitting during mutation', async () => {
    let resolve: (v: unknown) => void;
    mockSubmitMoodEntry.mockReturnValue(new Promise(r => { resolve = r; }));
    const { wrapper } = createWrapper();

    const { result: hook } = renderHook(() => useCheckinSubmit(), { wrapper });

    expect(hook.current.isSubmitting).toBe(false);

    let promise: Promise<unknown>;
    act(() => {
      promise = hook.current.submitCheckin(makeParams());
    });

    await waitFor(() => expect(hook.current.isSubmitting).toBe(true));

    await act(async () => {
      resolve!({ tip: '', pointsEarned: 10, newStreak: 1, alreadySubmitted: false });
      await promise!;
    });

    expect(hook.current.isSubmitting).toBe(false);
  });
});
