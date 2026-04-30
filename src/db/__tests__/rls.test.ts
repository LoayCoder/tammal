import { describe, expect, it } from 'vitest';

type Role = 'super_admin' | 'tenant_admin' | 'manager' | 'employee';
type Op = 'select' | 'insert' | 'update' | 'delete';

interface Principal {
  userId: string;
  tenantId: string;
  roles: Role[];
}

interface RowTenantScoped {
  tenant_id: string;
}

interface RowOwned extends RowTenantScoped {
  user_id?: string | null;
  employee_id?: string | null;
}

const canManageScoped = (p: Principal) =>
  p.roles.includes('super_admin') || p.roles.includes('tenant_admin') || p.roles.includes('manager');

const sameTenant = (p: Principal, row: RowTenantScoped) => p.tenantId === row.tenant_id;

function allowProfiles(op: Op, principal: Principal, row: RowOwned) {
  if (op === 'select') return sameTenant(principal, row);
  if (op === 'update') {
    const self = row.user_id === principal.userId;
    return self || (sameTenant(principal, row) && canManageScoped(principal));
  }
  return false;
}

function allowEmployees(op: Op, principal: Principal, row: RowTenantScoped) {
  if (op === 'select') return sameTenant(principal, row);
  if (op === 'insert' || op === 'update' || op === 'delete') {
    return sameTenant(principal, row) && canManageScoped(principal);
  }
  return false;
}

function allowQuestions(op: Op, principal: Principal, row: RowTenantScoped & { is_global?: boolean }) {
  if (op === 'select') return !!row.is_global || sameTenant(principal, row);
  if (op === 'insert' || op === 'update' || op === 'delete') {
    return sameTenant(principal, row) && canManageScoped(principal);
  }
  return false;
}

function allowPersonalTodos(op: Op, principal: Principal, row: RowTenantScoped) {
  // mirrors migration: "Tenant isolation for personal_todos" (FOR ALL USING/WITH CHECK tenant match)
  return ['select', 'insert', 'update', 'delete'].includes(op) && sameTenant(principal, row);
}

describe('RLS expectations (policy-mocking safety net)', () => {
  const tenantA = 'tenant-a';
  const tenantB = 'tenant-b';

  const adminA: Principal = { userId: 'u-admin-a', tenantId: tenantA, roles: ['tenant_admin'] };
  const userA: Principal = { userId: 'u-user-a', tenantId: tenantA, roles: ['employee'] };
  const managerA: Principal = { userId: 'u-manager-a', tenantId: tenantA, roles: ['manager'] };
  const userB: Principal = { userId: 'u-user-b', tenantId: tenantB, roles: ['employee'] };

  describe('tenant isolation across key tables', () => {
    it('blocks cross-tenant profile access', () => {
      const profileB = { tenant_id: tenantB, user_id: 'u-user-b' };
      expect(allowProfiles('select', userA, profileB)).toBe(false);
    });

    it('blocks cross-tenant employee updates even for admins', () => {
      const employeeB = { tenant_id: tenantB };
      expect(allowEmployees('update', adminA, employeeB)).toBe(false);
    });

    it('blocks cross-tenant question management', () => {
      const questionB = { tenant_id: tenantB, is_global: false };
      expect(allowQuestions('delete', managerA, questionB)).toBe(false);
    });

    it('blocks cross-tenant personal_todos operations', () => {
      const todoB = { tenant_id: tenantB };
      expect(allowPersonalTodos('select', userA, todoB)).toBe(false);
      expect(allowPersonalTodos('update', userA, todoB)).toBe(false);
    });
  });

  describe('role-based access inside same tenant', () => {
    it('allows admin to manage employees in their tenant', () => {
      const employeeA = { tenant_id: tenantA };
      expect(allowEmployees('update', adminA, employeeA)).toBe(true);
      expect(allowEmployees('delete', adminA, employeeA)).toBe(true);
    });

    it('prevents regular user from employee writes', () => {
      const employeeA = { tenant_id: tenantA };
      expect(allowEmployees('insert', userA, employeeA)).toBe(false);
      expect(allowEmployees('update', userA, employeeA)).toBe(false);
    });

    it('allows self-profile update for regular user but denies editing another user', () => {
      const selfProfile = { tenant_id: tenantA, user_id: 'u-user-a' };
      const otherProfile = { tenant_id: tenantA, user_id: 'u-manager-a' };
      expect(allowProfiles('update', userA, selfProfile)).toBe(true);
      expect(allowProfiles('update', userA, otherProfile)).toBe(false);
    });

    it('allows global question reads but not cross-tenant writes', () => {
      const globalQuestion = { tenant_id: tenantB, is_global: true };
      expect(allowQuestions('select', userA, globalQuestion)).toBe(true);
      expect(allowQuestions('update', userA, globalQuestion)).toBe(false);
    });
  });

  describe('sanity checks for expected allowed paths', () => {
    it('same-tenant regular user can read own-tenant profile/todo', () => {
      const profileA = { tenant_id: tenantA, user_id: 'u-user-a' };
      const todoA = { tenant_id: tenantA };
      expect(allowProfiles('select', userA, profileA)).toBe(true);
      expect(allowPersonalTodos('select', userA, todoA)).toBe(true);
    });

    it('other tenant user remains isolated', () => {
      const employeeA = { tenant_id: tenantA };
      expect(allowEmployees('select', userB, employeeA)).toBe(false);
    });
  });
});
