/**
 * useGamification — Hook Contract Tests
 *
 * Validates:
 * - Query key includes employeeId
 * - Disabled when employeeId is null
 * - Success flow returns streak + totalPoints
 * - Error flow propagates
 * - No business logic in hook (delegates to service)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mock service (NOT Supabase) ──
const mockFetchGamificationData = vi.fn();
const mockCalculatePoints = vi.fn((s: number) => 10 + Math.min(s * 5, 50));

vi.mock('@/services/gamificationService', () => ({
  fetchGamificationData: (id: string) => mockFetchGamificationData(id),
  calculatePoints: (s: number) => mockCalculatePoints(s),
}));

import { useGamification } from '@/hooks/wellness/useGamification';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useGamification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Query key correctness ──

  it('does not fetch when employeeId is null', () => {
    const { result } = renderHook(() => useGamification(null), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchGamificationData).not.toHaveBeenCalled();
  });

  it('fetches with employeeId as query key segment', async () => {
    mockFetchGamificationData.mockResolvedValue({ streak: 3, totalPoints: 85 });

    const { result } = renderHook(() => useGamification('emp-123'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetchGamificationData).toHaveBeenCalledWith('emp-123');
  });

  // ── Success flow ──

  it('returns streak and totalPoints from service', async () => {
    mockFetchGamificationData.mockResolvedValue({ streak: 5, totalPoints: 200 });

    const { result } = renderHook(() => useGamification('emp-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.streak).toBe(5);
    expect(result.current.totalPoints).toBe(200);
  });

  it('defaults to 0 when data is undefined', () => {
    const { result } = renderHook(() => useGamification(null), { wrapper: createWrapper() });
    expect(result.current.streak).toBe(0);
    expect(result.current.totalPoints).toBe(0);
  });

  // ── Error flow ──

  it('does not crash on service error', async () => {
    mockFetchGamificationData.mockRejectedValue(new Error('DB down'));

    const { result } = renderHook(() => useGamification('emp-err'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Defaults preserved
    expect(result.current.streak).toBe(0);
    expect(result.current.totalPoints).toBe(0);
  });

  // ── No business logic in hook ──

  it('exposes calculatePoints as a pass-through from service', () => {
    const { result } = renderHook(() => useGamification(null), { wrapper: createWrapper() });
    result.current.calculatePoints(3);
    expect(mockCalculatePoints).toHaveBeenCalledWith(3);
  });
});
