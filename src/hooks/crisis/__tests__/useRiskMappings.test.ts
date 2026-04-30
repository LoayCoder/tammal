import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockTenantId = { tenantId: 'tenant-1' };

const selectChain = {
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data: [{ id: '1', intent: 'talk', risk_level: 'low' }], error: null }),
};

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/hooks/org/useTenantId', () => ({
  useTenantId: () => mockTenantId,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => selectChain),
      insert: (...args: unknown[]) => mockInsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    })),
  },
}));

import { useRiskMappings, useCreateRiskMapping } from '@/hooks/crisis/useRiskMappings';

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useRiskMappings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches mappings list', async () => {
    const { result } = renderHook(() => useRiskMappings(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data?.[0].id).toBe('1');
  });

  it('creates a mapping and toasts success', async () => {
    const { result } = renderHook(() => useCreateRiskMapping(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ intent: 'unsafe', risk_level: 'high' });
    });
    expect(mockInsert).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith('Risk mapping created');
  });
});