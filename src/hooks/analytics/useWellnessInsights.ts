import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';

export interface WellnessInsight {
  executiveSummary: string;
  recommendations: { priority: 'high' | 'medium' | 'low'; title: string; description: string }[];
  predictedRisks: string[];
  positiveHighlights: string[];
}

export function useWellnessInsights(analyticsData: any | null, enabled: boolean = true) {
  const { user } = useAuth();
  const { i18n } = useTranslation();

  return useQuery({
    queryKey: ['wellness-insights', user?.id, analyticsData?.healthScore, analyticsData?.avgMoodScore],
    queryFn: async (): Promise<WellnessInsight | null> => {
      if (!analyticsData) return null;

      const { data, error } = await supabase.functions.invoke('generate-wellness-insights', {
        body: { analyticsData, language: i18n.language },
      });

      if (error) {
        logger.error('useWellnessInsights', 'Wellness insights error', error);
        return null;
      }

      return data as WellnessInsight;
    },
    enabled: !!user?.id && !!analyticsData && enabled,
    staleTime: 24 * 60 * 60 * 1000, // 24h cache
    retry: 1,
  });
}
