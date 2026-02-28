import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useAuditLog } from '@/hooks/audit/useAuditLog';

export type Plan = Tables<'plans'>;
export type PlanInsert = TablesInsert<'plans'>;
export type PlanUpdate = TablesUpdate<'plans'>;

export function usePlansManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logEvent } = useAuditLog();

  const plansQuery = useQuery({
    queryKey: ['plans-full'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .is('deleted_at', null)
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (plan: PlanInsert) => {
      const { data, error } = await supabase
        .from('plans')
        .insert(plan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plans-full'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(t('plans.createSuccess'));
      logEvent({
        entity_type: 'plan',
        entity_id: data.id,
        action: 'create',
        changes: { after: data },
      });
    },
    onError: (error) => {
      toast.error(t('plans.createError'));
      console.error('Create plan error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: PlanUpdate & { id: string }) => {
      // Fetch current data for audit log
      const { data: before } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, before };
    },
    onSuccess: ({ data, before }) => {
      queryClient.invalidateQueries({ queryKey: ['plans-full'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(t('plans.updateSuccess'));
      logEvent({
        entity_type: 'plan',
        entity_id: data.id,
        action: 'update',
        changes: { before, after: data },
      });
    },
    onError: (error) => {
      toast.error(t('plans.updateError'));
      console.error('Update plan error:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Fetch current data for audit log
      const { data: before } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      // Soft delete
      const { error } = await supabase
        .from('plans')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return before;
    },
    onSuccess: (before) => {
      queryClient.invalidateQueries({ queryKey: ['plans-full'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(t('plans.deleteSuccess'));
      if (before) {
        logEvent({
          entity_type: 'plan',
          entity_id: before.id,
          action: 'delete',
          changes: { before },
        });
      }
    },
    onError: (error) => {
      toast.error(t('plans.deleteError'));
      console.error('Delete plan error:', error);
    },
  });

  return {
    plans: plansQuery.data ?? [],
    isLoading: plansQuery.isLoading,
    error: plansQuery.error,
    createPlan: createMutation.mutate,
    updatePlan: updateMutation.mutate,
    deletePlan: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
