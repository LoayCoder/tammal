import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { TableInsert, TableUpdate } from '@/lib/supabase-types';

export interface GenerationPeriod {
  id: string;
  tenant_id: string;
  period_type: string;
  start_date: string;
  end_date: string;
  locked_category_ids: string[];
  locked_subcategory_ids: string[];
  status: string;
  purpose: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useGenerationPeriods(tenantId: string | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: periods = [], isPending } = useQuery({
    queryKey: ['generation-periods', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('generation_periods')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as GenerationPeriod[];
    },
    enabled: !!tenantId,
  });

  const activePeriods = periods.filter(p => p.status === 'active');

  const getActivePeriodForPurpose = (purpose: string): GenerationPeriod | null => {
    return activePeriods.find(p => p.purpose === purpose) || null;
  };

  const createPeriod = useMutation({
    mutationFn: async (params: {
      tenantId: string;
      periodType: string;
      startDate: string;
      endDate: string;
      lockedCategoryIds: string[];
      lockedSubcategoryIds: string[];
      purpose: string;
      createdBy?: string;
    }) => {
      // Check for existing active period for the same purpose
      const existing = activePeriods.find(p => p.purpose === params.purpose);
      if (existing) {
        throw new Error(t('aiGenerator.periodAlreadyActive'));
      }

      const insert: TableInsert<'generation_periods'> = {
        tenant_id: params.tenantId,
        period_type: params.periodType,
        start_date: params.startDate,
        end_date: params.endDate,
        locked_category_ids: params.lockedCategoryIds,
        locked_subcategory_ids: params.lockedSubcategoryIds,
        purpose: params.purpose,
        created_by: params.createdBy || null,
        status: 'active',
      };
      const { data, error } = await supabase
        .from('generation_periods')
        .insert(insert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-periods'] });
      toast.success(t('aiGenerator.periodCreated'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('aiGenerator.periodError'));
    },
  });

  const expirePeriod = useMutation({
    mutationFn: async (periodId: string) => {
      const statusUpdate: TableUpdate<'generation_periods'> = { status: 'expired' };
      const { error } = await supabase
        .from('generation_periods')
        .update(statusUpdate)
        .eq('id', periodId);
      if (error) throw error;

      // Cascade: deactivate linked question_sets
      await supabase
        .from('question_sets')
        .update({ status: 'inactive' })
        .eq('generation_period_id', periodId);

      // Cascade: deactivate linked question_generation_batches
      const batchUpdate: TableUpdate<'question_generation_batches'> = { status: 'inactive' };
      await supabase
        .from('question_generation_batches')
        .update(batchUpdate)
        .eq('generation_period_id', periodId);

      // Cascade: deactivate wellness_questions linked to batches under this period
      const { data: batches } = await supabase
        .from('question_generation_batches')
        .select('id')
        .eq('generation_period_id', periodId);

      if (batches && batches.length > 0) {
        const batchIds = batches.map(b => b.id);
        await supabase
          .from('wellness_questions')
          .update({ status: 'inactive' })
          .in('batch_id', batchIds);
      }

      // Cascade: deactivate generated_questions linked to this period
      const gqUpdate: TableUpdate<'generated_questions'> = { validation_status: 'inactive' };
      await supabase
        .from('generated_questions')
        .update(gqUpdate)
        .eq('generation_period_id', periodId);

      // Cascade: pause linked question_schedules
      await supabase
        .from('question_schedules')
        .update({ status: 'paused' })
        .eq('generation_period_id', periodId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-periods'] });
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      queryClient.invalidateQueries({ queryKey: ['question-schedules'] });
      toast.success(t('aiGenerator.periodExpired'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('aiGenerator.periodError'));
    },
  });

  const softDeletePeriod = useMutation({
    mutationFn: async (periodId: string) => {
      const update: TableUpdate<'generation_periods'> = { deleted_at: new Date().toISOString() };
      const { error } = await supabase
        .from('generation_periods')
        .update(update)
        .eq('id', periodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generation-periods'] });
      toast.success(t('aiGenerator.periodDeleted'));
    },
    onError: (err: Error) => {
      toast.error(err.message || t('aiGenerator.periodError'));
    },
  });

  return {
    periods,
    activePeriods,
    isPending,
    getActivePeriodForPurpose,
    createPeriod: createPeriod.mutate,
    createPeriodAsync: createPeriod.mutateAsync,
    isCreating: createPeriod.isPending,
    expirePeriod: expirePeriod.mutate,
    isExpiring: expirePeriod.isPending,
    softDeletePeriod: softDeletePeriod.mutate,
    isDeleting: softDeletePeriod.isPending,
  };
}
