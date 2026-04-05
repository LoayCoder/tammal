import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { computeStreak } from '@/services/gamificationService';

interface EngagementRankResult {
  rank: number;
  totalEmployees: number;
  streak: number;
  isPending: boolean;
  error: Error | null;
}

/**
 * Computes the current employee's engagement rank within their organization.
 * Ranks all employees by streak (desc) then response count (desc) over the last 30 days.
 */
export function useEmployeeEngagementRank(
  employeeId: string | null | undefined,
  tenantId: string | null | undefined,
): EngagementRankResult {
  const { data, isPending } = useQuery({
    queryKey: ['engagement-rank', tenantId, employeeId],
    queryFn: async () => {
      if (!tenantId || !employeeId) return null;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since = thirtyDaysAgo.toISOString().slice(0, 10);

      const { data: entries, error } = await supabase
        .from('mood_entries')
        .select('employee_id, entry_date')
        .eq('tenant_id', tenantId)
        .gte('entry_date', since)
        .is('deleted_at', null)
        .order('entry_date', { ascending: false })
        .limit(50000);

      if (error) throw error;
      if (!entries || entries.length === 0) return null;

      // Group by employee
      const empMap: Record<string, string[]> = {};
      entries.forEach((e) => {
        if (!empMap[e.employee_id]) empMap[e.employee_id] = [];
        empMap[e.employee_id].push(e.entry_date);
      });

      // Compute streak + count per employee, then sort
      // Grace period: if no entry today, prepend yesterday as anchor so streak isn't zeroed
      const todayStr = new Date().toISOString().slice(0, 10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const ranked = Object.entries(empMap)
        .map(([id, dates]) => {
          const unique = [...new Set(dates)].sort().reverse();
          // Allow 1-day grace: if latest entry is yesterday (not today), still count streak
          const needsGrace = unique[0] !== todayStr && unique[0] === yesterdayStr;
          const streakDates = needsGrace ? [todayStr, ...unique] : unique;
          const streak = computeStreak(streakDates.map((d) => ({ entry_date: d })));
          return { id, streak, count: unique.length };
        })
        .sort((a, b) => b.streak - a.streak || b.count - a.count);

      const idx = ranked.findIndex((r) => r.id === employeeId);
      if (idx === -1) return null;

      return {
        rank: idx + 1,
        totalEmployees: ranked.length,
        streak: ranked[idx].streak,
      };
    },
    enabled: !!employeeId && !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    rank: data?.rank ?? 0,
    totalEmployees: data?.totalEmployees ?? 0,
    streak: data?.streak ?? 0,
    isPending,
  };
}
