import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface EmployeeOption {
  id: string;
  full_name: string;
  role_title: string | null;
  department_id: string | null;
}

export interface EmployeeWithUser {
  id: string;
  full_name: string;
  email: string;
  user_id: string;
}

/** Fetch active employees for picker UI (id, full_name, role_title, department_id) */
export function useEmployeesList(departmentId?: string | null) {
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: ['employees-picker', tenantId, departmentId],
    queryFn: async () => {
      let query = supabase
        .from('employees')
        .select('id, full_name, role_title, department_id')
        .eq('tenant_id', tenantId!)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('full_name');
      if (departmentId) query = query.eq('department_id', departmentId);
      const { data, error } = await query;
      if (error) throw error;
      return data as EmployeeOption[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });
}

/** Fetch active employees with user_id (for representative assignment) */
export function useEmployeesWithUser(tenantId?: string) {
  return useQuery({
    queryKey: ['employees-with-user', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, user_id')
        .eq('tenant_id', tenantId!)
        .eq('status', 'active')
        .is('deleted_at', null)
        .not('user_id', 'is', null)
        .order('full_name');
      if (error) throw error;
      return data as EmployeeWithUser[];
    },
    enabled: !!tenantId,
  });
}

/** Resolve employee emails to IDs for bulk operations */
export function useResolveEmployeeEmails() {
  const { tenantId } = useTenantId();

  const resolve = async (emails: string[]) => {
    if (!tenantId || emails.length === 0) return new Map<string, string>();
    const { data: employees } = await supabase
      .from('employees')
      .select('id, email')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .in('email', emails);
    return new Map((employees ?? []).map(e => [e.email.toLowerCase(), e.id]));
  };

  return { resolve, tenantId };
}
