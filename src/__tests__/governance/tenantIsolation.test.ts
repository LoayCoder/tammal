import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for tenant isolation contract.
 * Validates that filtering logic never leaks cross-tenant data.
 */

interface TenantRow {
  id: string;
  tenant_id: string;
  data: string;
}

function filterByTenant(rows: TenantRow[], currentTenantId: string): TenantRow[] {
  return rows.filter(r => r.tenant_id === currentTenantId);
}

function filterSoftDeleted(rows: TenantRow & { deleted_at: string | null }[]): typeof rows {
  return rows.filter(r => r.deleted_at === null);
}

const multiTenantData: TenantRow[] = [
  { id: '1', tenant_id: 'tenant-a', data: 'A1' },
  { id: '2', tenant_id: 'tenant-a', data: 'A2' },
  { id: '3', tenant_id: 'tenant-b', data: 'B1' },
  { id: '4', tenant_id: 'tenant-c', data: 'C1' },
];

describe('Tenant Isolation Logic', () => {
  it('returns only rows for the current tenant', () => {
    const result = filterByTenant(multiTenantData, 'tenant-a');
    expect(result).toHaveLength(2);
    expect(result.every(r => r.tenant_id === 'tenant-a')).toBe(true);
  });

  it('never returns cross-tenant data', () => {
    const result = filterByTenant(multiTenantData, 'tenant-a');
    expect(result.some(r => r.tenant_id === 'tenant-b')).toBe(false);
    expect(result.some(r => r.tenant_id === 'tenant-c')).toBe(false);
  });

  it('returns empty array for unknown tenant', () => {
    const result = filterByTenant(multiTenantData, 'tenant-unknown');
    expect(result).toHaveLength(0);
  });

  it('filters soft-deleted records correctly', () => {
    const rows = [
      { id: '1', tenant_id: 't1', data: 'x', deleted_at: null },
      { id: '2', tenant_id: 't1', data: 'y', deleted_at: '2026-01-01' },
    ];
    const result = filterSoftDeleted(rows);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('current_tenant_id resolves deterministically', () => {
    // Simulates the DB function: profiles.tenant_id WHERE user_id = auth.uid()
    const profiles = [
      { user_id: 'user-1', tenant_id: 'tenant-a' },
      { user_id: 'user-2', tenant_id: 'tenant-b' },
    ];
    const resolve = (userId: string) => profiles.find(p => p.user_id === userId)?.tenant_id ?? null;
    expect(resolve('user-1')).toBe('tenant-a');
    expect(resolve('user-2')).toBe('tenant-b');
    expect(resolve('user-unknown')).toBeNull();
  });
});
