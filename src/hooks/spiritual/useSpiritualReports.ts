import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';

export interface SpiritualReport {
  id: string;
  user_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  report_data: {
    summary?: string;
    recommendations?: string[];
    prayerStats?: { completed: number; total: number; consistency: number };
    quranStats?: { sessions: number; totalMinutes: number; avgMinutes: number };
    fastingStats?: { completed: number; totalLogged: number };
    moodCorrelation?: { prayerImpact: number; quranImpact: number; fastingImpact: number };
    overallScore?: number;
    highlights?: string[];
  };
  created_at: string;
}

export function useSpiritualReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['spiritual-reports', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('spiritual_insight_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('period_end', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as SpiritualReport[];
    },
    enabled: !!user?.id,
  });

  const generateReport = useMutation({
    mutationFn: async (input: { reportType: string; periodStart: string; periodEnd: string }) => {
      const { data, error } = await supabase.functions.invoke('generate-spiritual-insights', {
        body: {
          report_type: input.reportType,
          period_start: input.periodStart,
          period_end: input.periodEnd,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-reports'] });
    },
  });

  const latestWeekly = reports.find(r => r.report_type === 'weekly');
  const latestMonthly = reports.find(r => r.report_type === 'monthly');

  return { reports, isLoading, generateReport, latestWeekly, latestMonthly };
}
