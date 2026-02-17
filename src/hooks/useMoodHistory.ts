import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format } from 'date-fns';

export interface MoodDataPoint {
  date: string;
  score: number;
  level: string;
}

export function useMoodHistory(employeeId: string | null) {
  const query = useQuery({
    queryKey: ['mood-history', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const fourteenDaysAgo = format(subDays(new Date(), 14), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('mood_entries')
        .select('entry_date, mood_score, mood_level')
        .eq('employee_id', employeeId)
        .gte('entry_date', fourteenDaysAgo)
        .order('entry_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((entry) => ({
        date: entry.entry_date,
        score: entry.mood_score,
        level: entry.mood_level,
      })) as MoodDataPoint[];
    },
    enabled: !!employeeId,
  });

  const moodData = query.data ?? [];

  // Compute 7-day average for burnout indicator
  const recentEntries = moodData.slice(-7);
  const avgMood7d =
    recentEntries.length > 0
      ? recentEntries.reduce((sum, e) => sum + e.score, 0) / recentEntries.length
      : 0;

  // Burnout zone: 1-2 = atRisk, 2-3 = watch, 3-5 = thriving
  const burnoutZone: 'thriving' | 'watch' | 'atRisk' =
    avgMood7d >= 3.5 ? 'thriving' : avgMood7d >= 2.5 ? 'watch' : 'atRisk';

  // Monthly check-in count
  const now = new Date();
  const firstOfMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
  const monthlyCheckins = moodData.filter((e) => e.date >= firstOfMonth).length;

  // Today's check-in
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = moodData.find((e) => e.date === today);

  return {
    moodData,
    avgMood7d: Math.round(avgMood7d * 10) / 10,
    burnoutZone,
    monthlyCheckins,
    todayEntry,
    isLoading: query.isLoading,
  };
}
