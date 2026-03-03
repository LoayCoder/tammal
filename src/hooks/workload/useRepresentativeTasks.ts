import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { UnifiedTask } from './useUnifiedTasks';

export interface RepresentativeAssignment {
  id: string;
  tenant_id: string;
  user_id: string;
  scope_type: 'division' | 'department' | 'section';
  scope_id: string;
}

export interface DistributeTaskPayload {
  title: string;
  title_ar?: string;
  description?: string;
  due_date?: string;
  priority?: number;
  estimated_minutes?: number;
  scope_type: string;
  scope_id: string;
}

export function useRepresentativeTasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  // Fetch user's representative assignments
  const assignmentsQuery = useQuery({
    queryKey: ['representative-assignments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representative_assignments')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return data as RepresentativeAssignment[];
    },
    enabled: !!user?.id,
  });

  // Fetch tasks created by this representative
  const tasksQuery = useQuery({
    queryKey: ['representative-tasks', user?.id, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('created_by', user!.id)
        .eq('source_type', 'representative_assigned')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as UnifiedTask[];
    },
    enabled: !!user?.id && !!tenantId,
  });

  // Distribute task via edge function
  const distributeMutation = useMutation({
    mutationFn: async (payload: DistributeTaskPayload) => {
      const { data, error } = await supabase.functions.invoke('distribute-representative-task', {
        body: { ...payload, tenant_id: tenantId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { distributed: number; batch_id: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['representative-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('representative.distributeSuccess', { count: data.distributed }));
    },
    onError: (err: Error) => toast.error(err.message || t('representative.distributeError')),
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoadingAssignments: assignmentsQuery.isPending,
    tasks: tasksQuery.data ?? [],
    isLoadingTasks: tasksQuery.isPending,
    distributeTask: distributeMutation.mutateAsync,
    isDistributing: distributeMutation.isPending,
    isRepresentative: (assignmentsQuery.data ?? []).length > 0,
  };
}
