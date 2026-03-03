import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { UnifiedTask, TaskComment } from './useUnifiedTasks';

export interface DepartmentEmployee {
  id: string;
  full_name: string;
  email: string;
  role_title: string | null;
}

export function useDepartmentTasks() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  // Fetch manager's department_id from employees table directly
  const managerQuery = useQuery({
    queryKey: ['manager-dept', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, department_id')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const departmentId = managerQuery.data?.department_id ?? null;
  const managerId = managerQuery.data?.id ?? null;

  // Fetch department employees
  const employeesQuery = useQuery({
    queryKey: ['dept-employees', tenantId, departmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, email, role_title')
        .eq('tenant_id', tenantId!)
        .eq('department_id', departmentId!)
        .is('deleted_at', null)
        .eq('status', 'active');
      if (error) throw error;
      return (data ?? []) as DepartmentEmployee[];
    },
    enabled: !!tenantId && !!departmentId,
  });

  const employeeIds = (employeesQuery.data ?? []).map(e => e.id);

  // Fetch tasks for all department employees
  const tasksQuery = useQuery({
    queryKey: ['dept-tasks', tenantId, departmentId, employeeIds],
    queryFn: async () => {
      if (employeeIds.length === 0) return [];
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*')
        .in('employee_id', employeeIds)
        .is('deleted_at', null)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []).map((d: Record<string, unknown>) => ({
        ...d,
        comments: (d.comments as TaskComment[]) ?? [],
      })) as UnifiedTask[];
    },
    enabled: !!tenantId && employeeIds.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: async (item: {
      tenant_id: string;
      employee_id: string;
      title: string;
      title_ar?: string | null;
      description?: string | null;
      source_type?: string;
      estimated_minutes?: number | null;
      due_date?: string | null;
      priority?: number;
      status?: string;
      tags?: string[];
      created_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .insert({ ...item, source_type: item.source_type ?? 'manager_assigned' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('teamWorkload.taskCreated'));
    },
    onError: () => toast.error(t('teamWorkload.taskCreateError')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('workload.tasks.updateSuccess'));
    },
    onError: () => toast.error(t('workload.tasks.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_tasks')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('workload.tasks.deleteSuccess'));
    },
    onError: () => toast.error(t('workload.tasks.deleteError')),
  });

  const lockMutation = useMutation({
    mutationFn: async ({ id, locked_by }: { id: string; locked_by: string }) => {
      const { error } = await supabase.from('unified_tasks').update({
        is_locked: true, locked_by, locked_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-tasks'] });
      toast.success(t('workload.lock.lockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.lockError')),
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('unified_tasks').update({
        is_locked: false, locked_by: null, locked_at: null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dept-tasks'] });
      toast.success(t('workload.lock.unlockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.unlockError')),
  });

  return {
    employees: employeesQuery.data ?? [],
    tasks: tasksQuery.data ?? [],
    isPending: employeesQuery.isPending || tasksQuery.isPending,
    departmentId,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    lockTask: lockMutation.mutate,
    unlockTask: unlockMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
