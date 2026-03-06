import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskChecklist {
  id: string;
  task_id: string;
  title: string;
  assigned_to: string | null;
  status: string;
  due_date: string | null;
  sort_order: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useTaskChecklists(taskId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['task-checklists', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklists')
        .select('*')
        .eq('task_id', taskId!)
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as TaskChecklist[];
    },
    enabled: !!taskId && !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (item: { task_id: string; title: string; assigned_to?: string | null; due_date?: string | null; sort_order?: number }) => {
      const { data, error } = await supabase.from('task_checklists').insert({ ...item, tenant_id: tenantId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists'] });
      toast.success(t('tasks.checklist.addSuccess'));
    },
    onError: () => toast.error(t('tasks.checklist.addError')),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskChecklist> & { id: string }) => {
      const { data, error } = await supabase.from('task_checklists').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists'] });
    },
    onError: () => toast.error(t('tasks.checklist.updateError')),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_checklists').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-checklists'] });
    },
    onError: () => toast.error(t('tasks.checklist.deleteError')),
  });

  return {
    checklists: query.data ?? [],
    isPending: query.isPending,
    createItem: create.mutate,
    updateItem: update.mutate,
    removeItem: remove.mutate,
  };
}
