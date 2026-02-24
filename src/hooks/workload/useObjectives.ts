import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface Objective {
  id: string;
  tenant_id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  year: number;
  quarter: string;
  owner_user_id: string | null;
  progress: number;
  status: string;
  start_date: string;
  end_date: string | null;
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ObjectiveInsert {
  tenant_id: string;
  title: string;
  title_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  year?: number;
  quarter?: string;
  owner_user_id?: string | null;
  status?: string;
  start_date?: string;
  end_date?: string | null;
}

export interface ObjectiveUpdate extends Partial<ObjectiveInsert> {
  id: string;
}

export function useObjectives() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();
  const { tenantId } = useTenantId();

  const objectivesQuery = useQuery({
    queryKey: ['objectives', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .select('*')
        .is('deleted_at', null)
        .order('year', { ascending: false })
        .order('quarter', { ascending: true });
      if (error) throw error;
      return data as Objective[];
    },
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: async (obj: ObjectiveInsert) => {
      const { data, error } = await supabase
        .from('strategic_objectives')
        .insert(obj)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.objectives.createSuccess'));
      logEvent({ entity_type: 'strategic_objective', entity_id: data.id, action: 'create', changes: { after: data } });
    },
    onError: () => toast.error(t('workload.objectives.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: ObjectiveUpdate) => {
      const { data: before } = await supabase.from('strategic_objectives').select('*').eq('id', id).single();
      const { data, error } = await supabase.from('strategic_objectives').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.objectives.updateSuccess'));
      logEvent({ entity_type: 'strategic_objective', entity_id: data.id, action: 'update', changes: { before, after: data } });
    },
    onError: () => toast.error(t('workload.objectives.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase.from('strategic_objectives').select('*').eq('id', id).single();
      const { error } = await supabase.from('strategic_objectives').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return before;
    },
    onSuccess: (before) => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.objectives.deleteSuccess'));
      if (before) logEvent({ entity_type: 'strategic_objective', entity_id: before.id, action: 'delete', changes: { before } });
    },
    onError: () => toast.error(t('workload.objectives.deleteError')),
  });

  const lockMutation = useMutation({
    mutationFn: async ({ id, locked_by }: { id: string; locked_by: string }) => {
      const { error } = await supabase.from('strategic_objectives').update({
        is_locked: true, locked_by, locked_at: new Date().toISOString(),
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.lock.lockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.lockError')),
  });

  const unlockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('strategic_objectives').update({
        is_locked: false, locked_by: null, locked_at: null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] });
      toast.success(t('workload.lock.unlockSuccess'));
    },
    onError: () => toast.error(t('workload.lock.unlockError')),
  });

  return {
    objectives: objectivesQuery.data ?? [],
    isLoading: objectivesQuery.isLoading,
    createObjective: createMutation.mutate,
    updateObjective: updateMutation.mutate,
    deleteObjective: deleteMutation.mutate,
    lockObjective: lockMutation.mutate,
    unlockObjective: unlockMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
