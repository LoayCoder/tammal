/**
 * useScheduleData — Hook Contract Tests
 *
 * Validates:
 * - Query keys include tenantId
 * - Disabled when tenantId is undefined
 * - Success flow returns departments + employees
 * - Error flow does not crash
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// ── Mock service ──
const mockFetchDepartments = vi.fn();
const mockFetchEmployees = vi.fn();

vi.mock('@/services/scheduleService', () => ({
  fetchDepartments: (...args: unknown[]) => mockFetchDepartments(...args),
  fetchEmployees: (...args: unknown[]) => mockFetchEmployees(...args),
}));

import { useScheduleData } from '@/hooks/admin/useScheduleData';

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe('useScheduleData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when tenantId is undefined', () => {
    renderHook(() => useScheduleData(undefined), { wrapper: createWrapper() });
    expect(mockFetchDepartments).not.toHaveBeenCalled();
    expect(mockFetchEmployees).not.toHaveBeenCalled();
  });

  it('fetches both departments and employees with tenantId', async () => {
    const depts = [{ id: 'd1', name: 'Eng' }];
    const emps = [{ id: 'e1', full_name: 'John' }];
    mockFetchDepartments.mockResolvedValue(depts);
    mockFetchEmployees.mockResolvedValue(emps);

    const { result } = renderHook(() => useScheduleData('tenant-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoadingDepartments).toBe(false);
      expect(result.current.isLoadingEmployees).toBe(false);
    });

    expect(mockFetchDepartments).toHaveBeenCalledWith('tenant-1');
    expect(mockFetchEmployees).toHaveBeenCalledWith('tenant-1');
    expect(result.current.availableDepartments).toEqual(depts);
    expect(result.current.availableEmployees).toEqual(emps);
  });

  it('defaults to empty arrays on error', async () => {
    mockFetchDepartments.mockRejectedValue(new Error('fail'));
    mockFetchEmployees.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useScheduleData('t-err'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoadingDepartments).toBe(false);
    });

    expect(result.current.availableDepartments).toEqual([]);
    expect(result.current.availableEmployees).toEqual([]);
  });

  it('uses stable query keys with tenantId', async () => {
    mockFetchDepartments.mockResolvedValue([]);
    mockFetchEmployees.mockResolvedValue([]);

    const wrapper = createWrapper();
    const { rerender } = renderHook(
      ({ tid }: { tid: string }) => useScheduleData(tid),
      { wrapper, initialProps: { tid: 't1' } },
    );

    await waitFor(() => expect(mockFetchDepartments).toHaveBeenCalledTimes(1));

    // Same tenantId — no refetch
    rerender({ tid: 't1' });
    expect(mockFetchDepartments).toHaveBeenCalledTimes(1);

    // Different tenantId — refetch
    rerender({ tid: 't2' });
    await waitFor(() => expect(mockFetchDepartments).toHaveBeenCalledTimes(2));
  });
});
