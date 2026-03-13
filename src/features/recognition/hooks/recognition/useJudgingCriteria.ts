import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface JudgingCriterion {
  id: string;
  tenant_id: string;
  theme_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  weight: number;
  scoring_guide: Record<string, string>;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateCriterionInput {
  theme_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  weight: number;
  scoring_guide?: Record<string, string>;
  sort_order?: number;
}

export function useJudgingCriteria(themeId?: string) {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: criteria = [], isPending } = useQuery({
    queryKey: ['judging-criteria', themeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('judging_criteria')
        .select('*')
        .eq('theme_id', themeId!)
        .is('deleted_at', null)
        .order('sort_order');
      if (error) throw error;
      return data as JudgingCriterion[];
    },
    enabled: !!themeId,
  });

  const createCriterion = useMutation({
    mutationFn: async (input: CreateCriterionInput) => {
      if (!tenantId) throw new Error('Missing tenant');
      const { data, error } = await supabase
        .from('judging_criteria')
        .insert({ ...input, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['judging-criteria'] });
      toast.success(t('recognition.criteria.createSuccess'));
    },
    onError: () => toast.error(t('recognition.criteria.createError')),
  });

  const updateCriterion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JudgingCriterion> & { id: string }) => {
      const { data, error } = await supabase
        .from('judging_criteria')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['judging-criteria'] });
      toast.success(t('recognition.criteria.updateSuccess'));
    },
    onError: () => toast.error(t('recognition.criteria.updateError')),
  });

  const deleteCriterion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('judging_criteria')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['judging-criteria'] });
      toast.success(t('recognition.criteria.deleteSuccess'));
    },
    onError: () => toast.error(t('recognition.criteria.deleteError')),
  });

  return { criteria, isPending, createCriterion, updateCriterion, deleteCriterion };
}
