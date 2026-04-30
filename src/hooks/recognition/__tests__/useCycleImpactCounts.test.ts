import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const themes = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ count: 2 }) };
const noms = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ count: 5 }) };
const votes = { eq: vi.fn().mockReturnThis(), is: vi.fn().mockResolvedValue({ count: 7 }) };

const mockFrom = vi
  .fn()
  .mockReturnValueOnce({ select: vi.fn(() => themes) })
  .mockReturnValueOnce({ select: vi.fn(() => noms) })
  .mockReturnValueOnce({ select: vi.fn(() => votes) });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { useCycleImpactCounts } from '@/hooks/recognition/useCycleImpactCounts';

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useCycleImpactCounts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns zero counts when cycleId is null', async () => {
    const { result } = renderHook(() => useCycleImpactCounts(null), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data).toBeUndefined());
  });

  it('aggregates themes/nominations/votes counts', async () => {
    const { result } = renderHook(() => useCycleImpactCounts('cycle-1'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toEqual({ themes: 2, nominations: 5, votes: 7 });
  });
});
