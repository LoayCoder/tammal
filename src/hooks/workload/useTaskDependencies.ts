import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskDependency {
  id: string;
  tenant_id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'blocks' | 'depends_on' | 'related_to';
  created_at: string;
  deleted_at: string | null;
}

export function useTaskDependencies(taskId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const queryKey = ['task-dependencies', tenantId, taskId];

  const depsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('task_dependencies')
        .select('*')
        .is('deleted_at', null);
      if (taskId) {
        query = query.or(`task_id.eq.${taskId},depends_on_task_id.eq.${taskId}`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as TaskDependency[];
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: async (item: {
      task_id: string;
      depends_on_task_id: string;
      dependency_type?: string;
    }) => {
      const { data, error } = await supabase
        .from('task_dependencies')
        .insert({ tenant_id: tenantId!, ...item })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', tenantId] });
      toast.success(t('workload.dependencies.createSuccess', 'Dependency added'));
    },
    onError: () => toast.error(t('workload.dependencies.createError', 'Failed to add dependency')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_dependencies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', tenantId] });
      toast.success(t('workload.dependencies.deleteSuccess', 'Dependency removed'));
    },
    onError: () => toast.error(t('workload.dependencies.deleteError', 'Failed to remove dependency')),
  });

  /**
   * Check if a task has unresolved blocking dependencies.
   */
  const hasBlockers = (actionId: string): boolean => {
    return (depsQuery.data ?? []).some(
      d =>
        d.task_id === actionId &&
        d.dependency_type === 'depends_on',
    );
  };

  return {
    dependencies: depsQuery.data ?? [],
    isPending: depsQuery.isPending,
    createDependency: createMutation.mutate,
    deleteDependency: deleteMutation.mutate,
    hasBlockers,
    isCreating: createMutation.isPending,
  };
}
