import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment_text: string;
  attachments: unknown[];
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee?: { full_name: string } | null;
}

export function useTaskComments(taskId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*, employee:employees!task_comments_user_id_fkey(full_name)')
        .eq('task_id', taskId!)
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TaskComment[];
    },
    enabled: !!taskId && !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (item: { task_id: string; user_id: string; comment_text: string }) => {
      const { data, error } = await supabase.from('task_comments').insert({ ...item, tenant_id: tenantId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments'] });
      toast.success(t('tasks.comments.addSuccess'));
    },
    onError: () => toast.error(t('tasks.comments.addError')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_comments').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments'] });
    },
    onError: () => toast.error(t('tasks.comments.deleteError')),
  });

  return {
    comments: query.data ?? [],
    isPending: query.isPending,
    addComment: create.mutate,
    removeComment: remove.mutate,
  };
}
