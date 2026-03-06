import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface TaskTag {
  id: string;
  name: string;
  name_ar: string | null;
  color: string;
  tenant_id: string;
  created_at: string;
  deleted_at: string | null;
}

export function useTaskTags() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { tenantId } = useTenantId();

  const query = useQuery({
    queryKey: ['task-tags', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_tags')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .order('name');
      if (error) throw error;
      return data as TaskTag[];
    },
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: async (item: { name: string; name_ar?: string; color?: string }) => {
      const { data, error } = await supabase.from('task_tags').insert({ ...item, tenant_id: tenantId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-tags'] });
      toast.success(t('tasks.tags.createSuccess'));
    },
    onError: () => toast.error(t('tasks.tags.createError')),
  });

  return {
    tags: query.data ?? [],
    isPending: query.isPending,
    createTag: create.mutate,
    createTagAsync: create.mutateAsync,
  };
}

export function useTaskTagLinks(taskId?: string) {
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['task-tag-links', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_tag_links')
        .select('*, task_tags(*)')
        .eq('task_id', taskId!)
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId && !!tenantId,
  });

  const link = useMutation({
    mutationFn: async ({ task_id, tag_id }: { task_id: string; tag_id: string }) => {
      const { error } = await supabase.from('task_tag_links').insert({ task_id, tag_id, tenant_id: tenantId! });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-tag-links'] }),
  });

  const unlink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_tag_links').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task-tag-links'] }),
  });

  return {
    tagLinks: query.data ?? [],
    isPending: query.isPending,
    linkTag: link.mutate,
    unlinkTag: unlink.mutate,
  };
}
