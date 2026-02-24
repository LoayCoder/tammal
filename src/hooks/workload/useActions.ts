import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { useTenantId } from '@/hooks/org/useTenantId';
import type { TaskComment } from './useUnifiedTasks';

export interface ObjAction {
  id: string;
  tenant_id: string;
  initiative_id: string;
  assignee_id: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  priority: number;
  estimated_hours: number;
  actual_hours: number | null;
  planned_start: string | null;
  planned_end: string | null;
  work_hours_only: boolean;
  status: string;
  source: string;
  dependencies: string[];
  metadata: Record<string, unknown>;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  comments: TaskComment[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ActionInsert {
  tenant_id: string;
  initiative_id: string;
  assignee_id?: string | null;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  priority?: number;
  estimated_hours?: number;
  planned_start?: string | null;
  planned_end?: string | null;
  work_hours_only?: boolean;
  status?: string;
  source?: string;
  created_by?: string | null;
}

export interface ActionUpdate extends Partial<ActionInsert> {
  id: string;
  actual_hours?: number | null;
}

export function useActions(initiativeId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();
  const { tenantId } = useTenantId();

  const actionsQuery = useQuery({
    queryKey: ['objective-actions', tenantId, initiativeId],
    queryFn: async () => {
      let query = supabase
        .from('objective_actions')
        .select('*')
        .is('deleted_at', null)
        .order('priority', { ascending: true });
      if (initiativeId) query = query.eq('initiative_id', initiativeId);
      const { data, error } = await query;
      if (error) throw error;
      return (data as any[]).map(d => ({ ...d, comments: d.comments ?? [] })) as ObjAction[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (item: ActionInsert) => {
      const { data, error } = await supabase.from('objective_actions').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['objective-actions'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.actions.createSuccess'));
      logEvent({ entity_type: 'objective_action', entity_id: data.id, action: 'create', changes: { after: data } });
    },
    onError: () => toast.error(t('workload.actions.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: ActionUpdate) => {
      const { data: before } = await supabase.from('objective_actions').select('*').eq('id', id).single();
      const { data, error } = await supabase.from('objective_actions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['objective-actions'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.actions.updateSuccess'));
      logEvent({ entity_type: 'objective_action', entity_id: data.id, action: 'update', changes: { before, after: data } });
    },
    onError: () => toast.error(t('workload.actions.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from('objective_actions').select('*').eq('id', id).single();
      const { error } = await supabase.from('objective_actions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return before;
    },
    onSuccess: (before) => {
      queryClient.invalidateQueries({ queryKey: ['objective-actions'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.actions.deleteSuccess'));
      if (before) logEvent({ entity_type: 'objective_action', entity_id: before.id, action: 'delete', changes: { before } });
    },
    onError: () => toast.error(t('workload.actions.deleteError')),
  });

  const lockMutation = useMutation({
    mutationFn: async ({ id, locked_by }: { id: string; locked_by: string }) => {
      const { error } = await supabase.from('objective_actions').update({
        is_locked: true, locked_by, locked_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-actions'] });
      toast.success(t('workload.lock.lockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.lockError')),
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('objective_actions').update({
        is_locked: false, locked_by: null, locked_at: null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-actions'] });
      toast.success(t('workload.lock.unlockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.unlockError')),
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment: TaskComment }) => {
      const { data: current, error: fetchErr } = await supabase
        .from('objective_actions').select('comments').eq('id', id).single();
      if (fetchErr) throw fetchErr;
      const comments = [...((current as any)?.comments ?? []), comment];
      const { error } = await supabase.from('objective_actions').update({ comments }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objective-actions'] });
      toast.success(t('workload.comments.addSuccess'));
    },
    onError: () => toast.error(t('workload.comments.addError')),
  });

  return {
    actions: actionsQuery.data ?? [],
    isLoading: actionsQuery.isLoading,
    createAction: createMutation.mutate,
    updateAction: updateMutation.mutate,
    deleteAction: deleteMutation.mutate,
    lockAction: lockMutation.mutate,
    unlockAction: unlockMutation.mutate,
    addComment: addCommentMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
