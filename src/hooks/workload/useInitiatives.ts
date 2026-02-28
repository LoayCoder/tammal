import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface Initiative {
  id: string;
  tenant_id: string;
  objective_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  owner_user_id: string | null;
  department_id: string | null;
  division_id: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  status: string;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InitiativeInsert {
  tenant_id: string;
  objective_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  owner_user_id?: string | null;
  department_id?: string | null;
  division_id?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
}

export interface InitiativeUpdate extends Partial<InitiativeInsert> {
  id: string;
}

export function useInitiatives(objectiveId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();
  const { tenantId } = useTenantId();

  const initiativesQuery = useQuery({
    queryKey: ['initiatives', tenantId, objectiveId],
    queryFn: async () => {
      let query = supabase
        .from('initiatives')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (objectiveId) query = query.eq('objective_id', objectiveId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Initiative[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (item: InitiativeInsert) => {
      const { data, error } = await supabase.from('initiatives').insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast.success(t('workload.initiatives.createSuccess'));
      logEvent({ entity_type: 'initiative', entity_id: data.id, action: 'create', changes: { after: data } });
    },
    onError: () => toast.error(t('workload.initiatives.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: InitiativeUpdate) => {
      const { data: before } = await supabase.from('initiatives').select('*').eq('id', id).single();
      const { data, error } = await supabase.from('initiatives').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast.success(t('workload.initiatives.updateSuccess'));
      logEvent({ entity_type: 'initiative', entity_id: data.id, action: 'update', changes: { before, after: data } });
    },
    onError: () => toast.error(t('workload.initiatives.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from('initiatives').select('*').eq('id', id).single();
      const { error } = await supabase.from('initiatives').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return before;
    },
    onSuccess: (before) => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast.success(t('workload.initiatives.deleteSuccess'));
      if (before) logEvent({ entity_type: 'initiative', entity_id: before.id, action: 'delete', changes: { before } });
    },
    onError: () => toast.error(t('workload.initiatives.deleteError')),
  });

  const lockMutation = useMutation({
    mutationFn: async ({ id, locked_by }: { id: string; locked_by: string }) => {
      const { error } = await supabase.from('initiatives').update({
        is_locked: true, locked_by, locked_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast.success(t('workload.lock.lockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.lockError')),
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('initiatives').update({
        is_locked: false, locked_by: null, locked_at: null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      toast.success(t('workload.lock.unlockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.unlockError')),
  });

  return {
    initiatives: initiativesQuery.data ?? [],
    isPending: initiativesQuery.isPending,
    createInitiative: createMutation.mutate,
    updateInitiative: updateMutation.mutate,
    deleteInitiative: deleteMutation.mutate,
    lockInitiative: lockMutation.mutate,
    unlockInitiative: unlockMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
