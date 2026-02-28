import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface AwardTheme {
  id: string;
  tenant_id: string;
  cycle_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  nomination_rules: Record<string, any>;
  voting_rules: Record<string, any>;
  rewards: Record<string, any>;
  data_integration: Record<string, any>;
  sort_order: number;
  created_at: string;
  deleted_at: string | null;
}

export interface CreateThemeInput {
  cycle_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  nomination_rules?: Record<string, any>;
  voting_rules?: Record<string, any>;
  rewards?: Record<string, any>;
  sort_order?: number;
}

export function useAwardThemes(cycleId?: string) {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: themes = [], isPending } = useQuery({
    queryKey: ['award-themes', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('award_themes')
        .select('*')
        .eq('cycle_id', cycleId!)
        .is('deleted_at', null)
        .order('sort_order');
      if (error) throw error;
      return data as AwardTheme[];
    },
    enabled: !!cycleId,
  });

  const createTheme = useMutation({
    mutationFn: async (input: CreateThemeInput) => {
      if (!tenantId) throw new Error('Missing tenant');
      const { data, error } = await supabase
        .from('award_themes')
        .insert({ ...input, tenant_id: tenantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-themes'] });
      toast.success(t('recognition.themes.createSuccess'));
    },
    onError: () => toast.error(t('recognition.themes.createError')),
  });

  const updateTheme = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AwardTheme> & { id: string }) => {
      const { data, error } = await supabase
        .from('award_themes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-themes'] });
      toast.success(t('recognition.themes.updateSuccess'));
    },
    onError: () => toast.error(t('recognition.themes.updateError')),
  });

  const deleteTheme = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('award_themes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-themes'] });
      toast.success(t('recognition.themes.deleteSuccess'));
    },
    onError: () => toast.error(t('recognition.themes.deleteError')),
  });

  return { themes, isPending, createTheme, updateTheme, deleteTheme };
}
