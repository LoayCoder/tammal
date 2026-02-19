import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format } from 'date-fns';

export interface OrgWellnessStats {
  activeEmployees: number;
  avgMoodScore: number;
  participationRate: number;
  moodDistribution: { level: string; count: number }[];
  recentTrend: { date: string; avg: number; count: number }[];
}

export function useOrgWellnessStats() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['org-wellness-stats', user?.id],
    queryFn: async (): Promise<OrgWellnessStats> => {
      const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      // 1. Active employee count (RLS scopes to tenant)
      const { count: activeEmployees } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);

      // 2. Mood entries last 7 days (aggregated)
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score, mood_level, entry_date, employee_id')
        .gte('entry_date', sevenDaysAgo)
        .lte('entry_date', today);

      const entries = moodEntries ?? [];

      // 3. Average mood score
      const avgMoodScore = entries.length > 0
        ? Math.round((entries.reduce((s, e) => s + e.mood_score, 0) / entries.length) * 10) / 10
        : 0;

      // 4. Participation rate
      const uniqueEmployees = new Set(entries.map(e => e.employee_id)).size;
      const totalActive = activeEmployees ?? 0;
      const participationRate = totalActive > 0
        ? Math.round((uniqueEmployees / totalActive) * 100)
        : 0;

      // 5. Mood distribution (count per level)
      const levelCounts: Record<string, number> = {};
      entries.forEach(e => {
        levelCounts[e.mood_level] = (levelCounts[e.mood_level] ?? 0) + 1;
      });
      const moodDistribution = Object.entries(levelCounts).map(([level, count]) => ({
        level,
        count,
      }));

      // 6. Daily trend (last 7 days)
      const dailyMap: Record<string, { total: number; count: number }> = {};
      entries.forEach(e => {
        if (!dailyMap[e.entry_date]) dailyMap[e.entry_date] = { total: 0, count: 0 };
        dailyMap[e.entry_date].total += e.mood_score;
        dailyMap[e.entry_date].count += 1;
      });
      const recentTrend = Object.entries(dailyMap)
        .map(([date, { total, count }]) => ({
          date,
          avg: Math.round((total / count) * 10) / 10,
          count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        activeEmployees: totalActive,
        avgMoodScore,
        participationRate,
        moodDistribution,
        recentTrend,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats: data,
    isLoading,
  };
}
