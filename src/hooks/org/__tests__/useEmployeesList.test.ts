import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const mockTenantId = { tenantId: 'tenant-1' };
const mockQuery = {
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [{ id: 'e1', full_name: 'User One', role_title: 'Mgr', department_id: 'd1' }],
    error: null,
  }),
};

vi.mock('@/hooks/org/useTenantId', () => ({
  useTenantId: () => mockTenantId,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => mockQuery),
    })),
  },
}));

import { useEmployeesList } from '@/hooks/org/useEmployeesList';

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useEmployeesList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns active employees list', async () => {
    const { result } = renderHook(() => useEmployeesList(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data?.[0].full_name).toBe('User One');
  });
});