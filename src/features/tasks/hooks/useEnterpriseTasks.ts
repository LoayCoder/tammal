import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface EnterpriseTask {
  id: string;
  tenant_id: string;
  employee_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  status: string;
  priority: number;
  progress: number;
  due_date: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  department_id: string | null;
  section_id: string | null;
  initiative_id: string | null;
  objective_id: string | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  approver_id: string | null;
  visibility: string;
  archived: boolean;
  archived_at: string | null;
  reminder_date: string | null;
  recurrence_rule: string | null;
  tags: string[] | null;
  source_type: string;
  is_locked: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateEnterpriseTaskInput {
  title: string;
  title_ar?: string | null;
  description?: string | null;
  employee_id: string;
  status?: string;
  priority?: number;
  due_date?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  estimated_minutes?: number | null;
  department_id?: string | null;
  section_id?: string | null;
  initiative_id?: string | null;
  objective_id?: string | null;
  assignee_id?: string | null;
  reviewer_id?: string | null;
  approver_id?: string | null;
  visibility?: string;
  reminder_date?: string | null;
  tags?: string[];
  created_by?: string | null;
}

export function useEnterpriseTasks(filters?: { employeeId?: string; status?: string; departmentId?: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['enterprise-tasks', tenantId, filters],
    queryFn: async () => {
      let q = supabase
        .from('unified_tasks')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .eq('archived', false)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (filters?.employeeId) q = q.eq('employee_id', filters.employeeId);
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.departmentId) q = q.eq('department_id', filters.departmentId);

      const { data, error } = await q;
      if (error) throw error;
      return data as EnterpriseTask[];
    },
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (input: CreateEnterpriseTaskInput) => {
      const { data, error } = await supabase.from('unified_tasks').insert({
        ...input,
        tenant_id: tenantId!,
        source_type: 'enterprise',
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('tasks.createSuccess'));
    },
    onError: () => toast.error(t('tasks.createError')),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EnterpriseTask> & { id: string }) => {
      const { data, error } = await supabase.from('unified_tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('tasks.updateSuccess'));
    },
    onError: () => toast.error(t('tasks.updateError')),
  });

  const softDelete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('unified_tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('tasks.deleteSuccess'));
    },
    onError: () => toast.error(t('tasks.deleteError')),
  });

  return {
    tasks: query.data ?? [],
    isPending: query.isPending,
    createTask: create.mutate,
    createTaskAsync: create.mutateAsync,
    updateTask: update.mutate,
    deleteTask: softDelete.mutate,
    isCreating: create.isPending,
  };
}
