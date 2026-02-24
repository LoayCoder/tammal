import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface UnifiedTask {
  id: string;
  tenant_id: string;
  employee_id: string;
  source_type: string;
  source_id: string | null;
  connector_id: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  due_date: string | null;
  is_work_hours: boolean;
  priority: number;
  status: string;
  external_url: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UnifiedTaskInsert {
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
}

export interface UnifiedTaskUpdate extends Partial<UnifiedTaskInsert> {
  id: string;
  actual_minutes?: number | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
}

export function useUnifiedTasks(employeeId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const tasksQuery = useQuery({
    queryKey: ['unified-tasks', tenantId, employeeId],
    queryFn: async () => {
      let query = supabase
        .from('unified_tasks')
        .select('*')
        .is('deleted_at', null)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error } = await query;
      if (error) throw error;
      return data as UnifiedTask[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (item: UnifiedTaskInsert) => {
      const { data, error } = await supabase.from('unified_tasks').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('workload.tasks.createSuccess'));
    },
    onError: () => toast.error(t('workload.tasks.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UnifiedTaskUpdate) => {
      const { data, error } = await supabase.from('unified_tasks').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('workload.tasks.updateSuccess'));
    },
    onError: () => toast.error(t('workload.tasks.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('unified_tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('workload.tasks.deleteSuccess'));
    },
    onError: () => toast.error(t('workload.tasks.deleteError')),
  });

  return {
    tasks: tasksQuery.data ?? [],
    isLoading: tasksQuery.isLoading,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
