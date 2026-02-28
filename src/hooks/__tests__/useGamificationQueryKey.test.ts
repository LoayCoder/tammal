/**
 * useGamification — Query Key Stability Test
 *
 * Validates that the same employeeId does not cause refetch,
 * but a different employeeId does.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockFetch = vi.fn();

vi.mock('@/services/gamificationService', () => ({
  fetchGamificationData: (...args: unknown[]) => mockFetch(...args),
  calculatePoints: (s: number) => 10 + Math.min(s * 5, 50),
}));

import { useGamification } from '@/hooks/wellness/useGamification';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useGamification query key stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ streak: 1, totalPoints: 10 });
  });

  it('does not refetch on rerender with same employeeId', async () => {
    const wrapper = createWrapper();
    const { rerender } = renderHook(
      ({ id }: { id: string }) => useGamification(id),
      { wrapper, initialProps: { id: 'emp-1' } },
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    rerender({ id: 'emp-1' });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetches when employeeId changes', async () => {
    const wrapper = createWrapper();
    const { rerender } = renderHook(
      ({ id }: { id: string }) => useGamification(id),
      { wrapper, initialProps: { id: 'emp-1' } },
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    rerender({ id: 'emp-2' });
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
