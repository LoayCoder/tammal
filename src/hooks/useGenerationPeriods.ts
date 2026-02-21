import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface GenerationPeriod {
  id: string;
  tenant_id: string;
  period_type: string;
  start_date: string;
  end_date: string;
  locked_category_ids: string[];
  locked_subcategory_ids: string[];
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useGenerationPeriods(tenantId: string | null) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: periods = [], isLoading } = useQuery({
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
      return (data || []) as unknown as GenerationPeriod[];
    },
    enabled: !!tenantId,
  });

  const activePeriods = periods.filter(p => p.status === 'active');

  const createPeriod = useMutation({
    mutationFn: async (params: {
      tenantId: string;
      periodType: string;
      startDate: string;
      endDate: string;
      lockedCategoryIds: string[];
      lockedSubcategoryIds: string[];
      createdBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('generation_periods')
        .insert({
          tenant_id: params.tenantId,
          period_type: params.periodType,
          start_date: params.startDate,
          end_date: params.endDate,
          locked_category_ids: params.lockedCategoryIds,
          locked_subcategory_ids: params.lockedSubcategoryIds,
          created_by: params.createdBy || null,
          status: 'active',
        } as any)
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

  return {
    periods,
    activePeriods,
    isLoading,
    createPeriod: createPeriod.mutate,
    isCreating: createPeriod.isPending,
  };
}
