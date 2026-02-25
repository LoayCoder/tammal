import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ThemeResult {
  id: string;
  tenant_id: string;
  theme_id: string;
  cycle_id: string;
  first_place_nomination_id: string | null;
  second_place_nomination_id: string | null;
  third_place_nomination_id: string | null;
  fairness_report: Record<string, any>;
  appeal_status: string;
  published_at: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface NomineeRanking {
  id: string;
  tenant_id: string;
  theme_results_id: string;
  nomination_id: string;
  rank: number;
  raw_average_score: number | null;
  weighted_average_score: number | null;
  criterion_breakdown: Record<string, any>;
  total_votes: number | null;
  vote_distribution: Record<string, any> | null;
  confidence_interval: Record<string, any> | null;
  data_metrics_validation: Record<string, any> | null;
  created_at: string;
}

export function useResults(cycleId?: string) {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: results = [], isLoading: resultsLoading } = useQuery({
    queryKey: ['theme-results', tenantId, cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      const { data, error } = await supabase
        .from('theme_results')
        .select('*')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return (data || []) as unknown as ThemeResult[];
    },
    enabled: !!tenantId && !!cycleId,
  });

  const resultIds = results.map(r => r.id);
  const { data: rankings = [], isLoading: rankingsLoading } = useQuery({
    queryKey: ['nominee-rankings', tenantId, cycleId, resultIds],
    queryFn: async () => {
      if (!resultIds.length) return [];
      const { data, error } = await supabase
        .from('nominee_rankings')
        .select('*')
        .in('theme_results_id', resultIds)
        .is('deleted_at', null)
        .order('rank');
      if (error) throw error;
      return (data || []) as unknown as NomineeRanking[];
    },
    enabled: !!tenantId && !!cycleId && resultIds.length > 0,
  });

  const calculateResults = useMutation({
    mutationFn: async (targetCycleId: string) => {
      const { data, error } = await supabase.functions.invoke('calculate-recognition-results', {
        body: { cycle_id: targetCycleId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['theme-results'] });
      qc.invalidateQueries({ queryKey: ['nominee-rankings'] });
      qc.invalidateQueries({ queryKey: ['award-cycles'] });
      toast.success(t('recognition.results.calculateSuccess'));
    },
    onError: () => toast.error(t('recognition.results.calculateError')),
  });

  const publishResults = useMutation({
    mutationFn: async (themeResultId: string) => {
      const { error } = await supabase
        .from('theme_results')
        .update({ published_at: new Date().toISOString() })
        .eq('id', themeResultId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['theme-results'] });
      toast.success(t('recognition.results.publishSuccess'));
    },
    onError: () => toast.error(t('recognition.results.publishError')),
  });

  return { results, rankings, resultsLoading, rankingsLoading, calculateResults, publishResults };
}
