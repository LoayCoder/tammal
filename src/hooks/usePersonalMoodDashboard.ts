import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentEmployee } from './useCurrentEmployee';
import { useMoodDefinitions } from './useMoodDefinitions';
import { useGamification } from './useGamification';
import { format, subDays, getDay, startOfMonth } from 'date-fns';

export interface PersonalMoodEntry {
  date: string;
  score: number;
  level: string;
}

export interface MoodDistributionItem {
  level: string;
  count: number;
}

export interface DayActivity {
  day: number; // 0=Sun .. 6=Sat
  count: number;
}

export interface SurveyStats {
  totalAnswered: number;
  avgScore: number;
  completionRate: number;
}

export function usePersonalMoodDashboard() {
  const { employee, isLoading: empLoading } = useCurrentEmployee();
  const employeeId = employee?.id ?? null;
  const tenantId = employee?.tenant_id ?? null;

  const { moods: moodDefs, isLoading: defsLoading } = useMoodDefinitions(tenantId);
  const { streak, isLoading: streakLoading } = useGamification(employeeId);

  // ── Extended mood history (90 days) ──
  const { data: moodHistory = [], isLoading: histLoading } = useQuery({
    queryKey: ['personal-mood-history-90', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const since = format(subDays(new Date(), 90), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('mood_entries')
        .select('entry_date, mood_score, mood_level')
        .eq('employee_id', employeeId)
        .gte('entry_date', since)
        .order('entry_date', { ascending: true })
        .limit(10000);
      if (error) throw error;
      return (data || []).map((e: any) => ({
        date: e.entry_date,
        score: e.mood_score,
        level: e.mood_level,
      })) as PersonalMoodEntry[];
    },
    enabled: !!employeeId,
  });

  // ── Org average (only for admins/managers – RLS restricts employees) ──
  const { data: orgAvgMap = {}, isLoading: orgLoading } = useQuery({
    queryKey: ['org-mood-avg-14', tenantId],
    queryFn: async () => {
      if (!tenantId) return {};
      const since = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      // This will only return data if user has tenant-level access (admin/manager)
      const { data, error } = await supabase
        .from('mood_entries')
        .select('entry_date, mood_score')
        .eq('tenant_id', tenantId)
        .gte('entry_date', since)
        .limit(10000);
      if (error) {
        // RLS will block non-admins – return empty gracefully
        console.warn('Org average unavailable (RLS):', error.message);
        return {};
      }
      if (!data || data.length === 0) return {};
      // Group by date and average
      const grouped: Record<string, { sum: number; count: number }> = {};
      for (const e of data as any[]) {
        const d = e.entry_date;
        if (!grouped[d]) grouped[d] = { sum: 0, count: 0 };
        grouped[d].sum += e.mood_score;
        grouped[d].count++;
      }
      const result: Record<string, number> = {};
      for (const [d, v] of Object.entries(grouped)) {
        result[d] = Math.round((v.sum / v.count) * 10) / 10;
      }
      return result;
    },
    enabled: !!tenantId,
  });

  // ── Survey stats ──
  const { data: surveyStats, isLoading: surveyLoading } = useQuery({
    queryKey: ['personal-survey-stats', employeeId],
    queryFn: async (): Promise<SurveyStats> => {
      if (!employeeId) return { totalAnswered: 0, avgScore: 0, completionRate: 0 };

      // Total answered
      const { count: answeredCount, error: aErr } = await supabase
        .from('employee_responses')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employeeId);
      if (aErr) throw aErr;

      // Total delivered
      const { count: deliveredCount, error: dErr } = await supabase
        .from('scheduled_questions')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employeeId)
        .eq('status', 'delivered');
      if (dErr) throw dErr;

      // Avg score from responses
      const { data: responses, error: rErr } = await supabase
        .from('employee_responses')
        .select('answer_value')
        .eq('employee_id', employeeId)
        .limit(5000);
      if (rErr) throw rErr;

      let scoreSum = 0;
      let scoreCount = 0;
      for (const r of (responses || []) as any[]) {
        const val = r.answer_value;
        let num: number | null = null;
        if (typeof val === 'number') num = val;
        else if (typeof val === 'string') num = parseFloat(val);
        else if (typeof val === 'object' && val !== null) {
          num = val.value ?? val.score ?? null;
        }
        if (num !== null && !isNaN(num)) {
          scoreSum += num;
          scoreCount++;
        }
      }

      const total = answeredCount ?? 0;
      const delivered = deliveredCount ?? 0;
      return {
        totalAnswered: total,
        avgScore: scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0,
        completionRate: delivered > 0 ? Math.round((total / delivered) * 100) : 0,
      };
    },
    enabled: !!employeeId,
  });

  // ── Reframe stats ──
  const { data: reframeStats, isLoading: reframeLoading } = useQuery({
    queryKey: ['reframe-stats', employeeId],
    queryFn: async () => {
      if (!employeeId) return { total: 0, thisMonth: 0, streak: 0 };
      const { data, error } = await supabase
        .from('thought_reframes' as any)
        .select('created_at')
        .eq('employee_id', employeeId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) return { total: 0, thisMonth: 0, streak: 0 };
      const entries = (data || []) as unknown as { created_at: string }[];
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const thisMonth = entries.filter(r => r.created_at.slice(0, 10) >= monthStart).length;
      // streak
      const uniqueDays = [...new Set(entries.map(r => r.created_at.slice(0, 10)))].sort().reverse();
      let streak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
        let expected = uniqueDays[0];
        for (const day of uniqueDays) {
          if (day === expected) { streak++; expected = format(subDays(new Date(day), 1), 'yyyy-MM-dd'); }
          else break;
        }
      }
      return { total: entries.length, thisMonth, streak };
    },
    enabled: !!employeeId,
  });

  // ── Derived data ──
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = moodHistory.find((e) => e.date === today);

  // 7-day average
  const recentEntries = moodHistory.filter(
    (e) => e.date >= format(subDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const avgMood7d =
    recentEntries.length > 0
      ? Math.round(
          (recentEntries.reduce((s, e) => s + e.score, 0) / recentEntries.length) * 10
        ) / 10
      : 0;

  const burnoutZone: 'thriving' | 'watch' | 'atRisk' =
    avgMood7d >= 3.5 ? 'thriving' : avgMood7d >= 2.5 ? 'watch' : 'atRisk';

  // Monthly check-ins
  const firstOfMonth = format(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    'yyyy-MM-dd'
  );
  const monthlyCheckins = moodHistory.filter((e) => e.date >= firstOfMonth).length;
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  // Mood distribution
  const distribution: Record<string, number> = {};
  for (const e of moodHistory) {
    distribution[e.level] = (distribution[e.level] || 0) + 1;
  }

  // Day-of-week activity
  const dayActivity: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const e of moodHistory) {
    const dayOfWeek = getDay(new Date(e.date));
    dayActivity[dayOfWeek]++;
  }

  // 14-day trend data for chart
  const last14 = moodHistory.filter(
    (e) => e.date >= format(subDays(new Date(), 14), 'yyyy-MM-dd')
  );

  const hasOrgData = Object.keys(orgAvgMap).length > 0;

  const isLoading = empLoading || defsLoading || streakLoading || histLoading || orgLoading || surveyLoading || reframeLoading;

  return {
    employee,
    isLoading,
    moodDefs,
    streak,
    moodHistory,
    last14,
    orgAvgMap,
    hasOrgData,
    todayEntry,
    avgMood7d,
    burnoutZone,
    monthlyCheckins,
    daysInMonth,
    distribution,
    dayActivity,
    surveyStats: surveyStats ?? { totalAnswered: 0, avgScore: 0, completionRate: 0 },
    reframeStats: reframeStats ?? { total: 0, thisMonth: 0, streak: 0 },
  };
}
