import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees, type Employee, type EmployeeFilters } from './useEmployees';
import type { AccountStatus } from '@/components/employees/AccountStatusBadge';

export interface UnifiedEmployee extends Employee {
  accountStatus: AccountStatus;
  profileStatus?: string;
  roleName?: string;
  roleColor?: string;
  lastLogin?: string;
}

interface UseUnifiedUsersOptions extends EmployeeFilters {
  tenantId?: string;
  accountStatusFilter?: AccountStatus;
}

export function useUnifiedUsers(options?: UseUnifiedUsersOptions) {
  const employeesHook = useEmployees({
    department: options?.department,
    status: options?.status,
    search: options?.search,
  });

  // Fetch profiles for employees that have user_id
  const { data: profiles = [] } = useQuery({
    queryKey: ['unified-profiles', options?.tenantId],
    queryFn: async () => {
      if (!options?.tenantId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, status')
        .eq('tenant_id', options.tenantId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!options?.tenantId,
  });

  // Fetch pending invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ['unified-invitations', options?.tenantId],
    queryFn: async () => {
      if (!options?.tenantId) return [];
      const { data, error } = await supabase
        .from('invitations')
        .select('employee_id, email, used, expires_at, deleted_at')
        .eq('tenant_id', options.tenantId)
        .is('deleted_at', null)
        .eq('used', false);
      if (error) throw error;
      return data || [];
    },
    enabled: !!options?.tenantId,
  });

  // Fetch user roles for linked employees
  const linkedUserIds = employeesHook.employees
    .filter(e => e.user_id)
    .map(e => e.user_id as string);

  const { data: userRoles = [] } = useQuery({
    queryKey: ['unified-user-roles', linkedUserIds],
    queryFn: async () => {
      if (linkedUserIds.length === 0) return [];
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          roles:custom_role_id(name, name_ar, color)
        `)
        .in('user_id', linkedUserIds);
      if (error) throw error;
      return data || [];
    },
    enabled: linkedUserIds.length > 0,
  });

  // Fetch last login for linked users
  const { data: loginHistory = [] } = useQuery({
    queryKey: ['unified-last-login', linkedUserIds],
    queryFn: async () => {
      if (linkedUserIds.length === 0) return [];
      // Get the most recent login for each user
      const { data, error } = await supabase
        .from('login_history')
        .select('user_id, created_at')
        .in('user_id', linkedUserIds)
        .eq('success', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Deduplicate to get only the latest per user
      const latestByUser = new Map<string, string>();
      (data || []).forEach(entry => {
        if (!latestByUser.has(entry.user_id)) {
          latestByUser.set(entry.user_id, entry.created_at);
        }
      });
      return Array.from(latestByUser.entries()).map(([user_id, created_at]) => ({ user_id, created_at }));
    },
    enabled: linkedUserIds.length > 0,
  });

  // Compute unified employees
  const unifiedEmployees: UnifiedEmployee[] = employeesHook.employees.map(emp => {
    let accountStatus: AccountStatus = 'not_invited';
    let profileStatus: string | undefined;
    let roleName: string | undefined;
    let roleColor: string | undefined;
    let lastLogin: string | undefined;

    if (emp.user_id) {
      const profile = profiles.find(p => p.user_id === emp.user_id);
      profileStatus = profile?.status;
      
      if (profileStatus === 'suspended') {
        accountStatus = 'suspended';
      } else if (profileStatus === 'inactive') {
        accountStatus = 'inactive';
      } else {
        accountStatus = 'active';
      }

      // Get role
      const role = userRoles.find(r => r.user_id === emp.user_id);
      if (role?.roles && !Array.isArray(role.roles)) {
        const roleData = role.roles as { name: string; name_ar: string | null; color: string };
        roleName = roleData.name;
        roleColor = roleData.color;
      }

      // Get last login
      const login = loginHistory.find(l => l.user_id === emp.user_id);
      lastLogin = login?.created_at;
    } else {
      // Check if there's a pending invitation
      const pendingInvite = invitations.find(inv => {
        const notExpired = new Date(inv.expires_at) > new Date();
        return (inv.employee_id === emp.id || inv.email === emp.email) && notExpired;
      });
      
      if (pendingInvite) {
        accountStatus = 'invited';
      }
    }

    return {
      ...emp,
      accountStatus,
      profileStatus,
      roleName,
      roleColor,
      lastLogin,
    };
  });

  // Apply account status filter
  const filteredEmployees = options?.accountStatusFilter
    ? unifiedEmployees.filter(e => e.accountStatus === options.accountStatusFilter)
    : unifiedEmployees;

  return {
    ...employeesHook,
    employees: filteredEmployees,
    unifiedEmployees: filteredEmployees,
    allInvitations: invitations,
    profiles,
  };
}
