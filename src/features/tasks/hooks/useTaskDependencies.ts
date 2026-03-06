import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: string;
  created_at: string;
  depends_on_task?: { id: string; title: string; status: string; priority: number };
  dependent_task?: { id: string; title: string; status: string; priority: number };
}

export function useTaskDependencies(taskId: string | undefined) {
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const qc = useQueryClient();

  // Dependencies this task depends ON (blockers)
  const { data: blockers = [], isPending: blockersLoading } = useQuery({
    queryKey: ['task-dependencies', 'blockers', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_task_dependencies')
        .select('*, depends_on_task:unified_tasks!unified_task_dependencies_depends_on_task_id_fkey(id, title, status, priority)')
        .eq('task_id', taskId!)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as unknown as TaskDependency[];
    },
    enabled: !!taskId && !!tenantId,
  });

  // Tasks that depend on THIS task (dependents)
  const { data: dependents = [], isPending: dependentsLoading } = useQuery({
    queryKey: ['task-dependencies', 'dependents', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_task_dependencies')
        .select('*, dependent_task:unified_tasks!unified_task_dependencies_task_id_fkey(id, title, status, priority)')
        .eq('depends_on_task_id', taskId!)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as unknown as TaskDependency[];
    },
    enabled: !!taskId && !!tenantId,
  });

  const addDependency = useMutation({
    mutationFn: async ({ dependsOnTaskId, type = 'blocks' }: { dependsOnTaskId: string; type?: string }) => {
      const { error } = await supabase
        .from('unified_task_dependencies')
        .insert({
          tenant_id: tenantId!,
          task_id: taskId!,
          depends_on_task_id: dependsOnTaskId,
          dependency_type: type,
          created_by: employee?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-dependencies'] });
    },
  });

  const removeDependency = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('unified_task_dependencies')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task-dependencies'] });
    },
  });

  const hasUnresolvedBlockers = blockers
    .filter(b => b.dependency_type === 'blocks')
    .some(b => {
      const task = b.depends_on_task as any;
      return task && task.status !== 'completed';
    });

  return {
    blockers,
    dependents,
    isPending: blockersLoading || dependentsLoading,
    addDependency: addDependency.mutate,
    removeDependency: removeDependency.mutate,
    isAdding: addDependency.isPending,
    hasUnresolvedBlockers,
  };
}
