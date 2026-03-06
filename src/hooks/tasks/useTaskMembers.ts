import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export type TaskMemberRole = 'assignee' | 'reviewer' | 'approver' | 'observer';

export interface TaskMember {
  id: string;
  task_id: string;
  user_id: string;
  role: TaskMemberRole;
  tenant_id: string;
  created_at: string;
  deleted_at: string | null;
}

export function useTaskMembers(taskId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['task-members', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_members')
        .select('*')
        .eq('task_id', taskId!)
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null);
      if (error) throw error;
      return data as TaskMember[];
    },
    enabled: !!taskId && !!tenantId,
  });

  const add = useMutation({
    mutationFn: async (item: { task_id: string; user_id: string; role: TaskMemberRole }) => {
      const { data, error } = await supabase.from('task_members').insert({ ...item, tenant_id: tenantId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-members'] });
      toast.success(t('tasks.members.addSuccess'));
    },
    onError: () => toast.error(t('tasks.members.addError')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_members').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-members'] });
    },
    onError: () => toast.error(t('tasks.members.removeError')),
  });

  return {
    members: query.data ?? [],
    isPending: query.isPending,
    addMember: add.mutate,
    removeMember: remove.mutate,
  };
}
