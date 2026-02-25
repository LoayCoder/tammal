import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGamification(employeeId: string | null) {
  const query = useQuery({
    queryKey: ['gamification', employeeId],
    queryFn: async () => {
      if (!employeeId) return { streak: 0, totalPoints: 0 };

      const { data: entries, error } = await supabase
        .from('mood_entries')
        .select('entry_date, points_earned')
        .eq('employee_id', employeeId)
        .order('entry_date', { ascending: false })
        .limit(60);

      if (error) throw error;
      if (!entries || entries.length === 0) return { streak: 0, totalPoints: 0 };

      // Calculate streak using UTC-only dates to avoid timezone bugs
      let streak = 0;
      const now = new Date();
      const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

      for (let i = 0; i < entries.length; i++) {
        // entry_date is a 'YYYY-MM-DD' string — parse as UTC
        const [y, m, d] = entries[i].entry_date.split('-').map(Number);
        const entryUTC = Date.UTC(y, m - 1, d);
        const expectedUTC = todayUTC - i * 86400000; // i days ago

        if (entryUTC === expectedUTC) {
          streak++;
        } else {
          break;
        }
      }

      const totalPoints = entries.reduce((sum, e) => sum + (e.points_earned || 0), 0);

      return { streak, totalPoints };
    },
    enabled: !!employeeId,
  });

  const calculatePoints = (currentStreak: number): number => {
    return 10 + Math.min(currentStreak * 5, 50);
  };

  return {
    streak: query.data?.streak ?? 0,
    totalPoints: query.data?.totalPoints ?? 0,
    isLoading: query.isLoading,
    calculatePoints,
  };
}
