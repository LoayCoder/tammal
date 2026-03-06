import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function useTaskDetail(id: string | undefined) {
  const { data: task, isPending: taskLoading } = useQuery({
    queryKey: ['task-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*, employee:employees!unified_tasks_employee_id_fkey(full_name)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  return { task, taskLoading };
}

export function useTaskUpdate(id: string | undefined) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { error } = await supabase.from('unified_tasks').update(updates).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('tasks.updateSuccess'));
    },
    onError: () => toast.error(t('tasks.updateError')),
  });
}
