import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { subDays, format, eachDayOfInterval, getDay } from 'date-fns';

export type TimeRange = 7 | 30 | 90;

export interface CategoryScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  avgScore: number;
  responseCount: number;
}

export interface SubcategoryScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  categoryName: string;
  categoryNameAr: string | null;
  avgScore: number;
  responseCount: number;
}

export interface AffectiveDistribution {
  state: 'positive' | 'neutral' | 'negative';
  count: number;
  percentage: number;
}

export interface DayOfWeekActivity {
  day: number; // 0=Sun, 6=Sat
  count: number;
}

export interface OrgAnalyticsData {
  // KPIs
  activeEmployees: number;
  avgMoodScore: number;
  participationRate: number;
  surveyResponseRate: number;
  riskPercentage: number;
  avgStreak: number;

  // Charts
  moodTrend: { date: string; avg: number; count: number; responseCount: number }[];
  moodDistribution: { level: string; count: number; percentage: number }[];
  categoryScores: CategoryScore[];
  subcategoryScores: SubcategoryScore[];
  affectiveDistribution: AffectiveDistribution[];
  dayOfWeekActivity: DayOfWeekActivity[];
}

export function useOrgAnalytics(timeRange: TimeRange = 30) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['org-analytics', user?.id, timeRange],
    queryFn: async (): Promise<OrgAnalyticsData> => {
      const startDate = format(subDays(new Date(), timeRange), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      // 1. Active employees
      const { count: activeEmployees } = await supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .is('deleted_at', null);

      const totalActive = activeEmployees ?? 0;

      // 2. Mood entries for the range
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('mood_score, mood_level, entry_date, employee_id')
        .gte('entry_date', startDate)
        .lte('entry_date', today);

      const entries = moodEntries ?? [];

      // 3. Average mood score
      const avgMoodScore = entries.length > 0
        ? Math.round((entries.reduce((s, e) => s + e.mood_score, 0) / entries.length) * 10) / 10
        : 0;

      // 4. Participation rate
      const uniqueEmployees = new Set(entries.map(e => e.employee_id)).size;
      const participationRate = totalActive > 0
        ? Math.round((uniqueEmployees / totalActive) * 100)
        : 0;

      // 5. Risk percentage (mood_score <= 2)
      const riskCount = entries.filter(e => e.mood_score <= 2).length;
      const riskPercentage = entries.length > 0
        ? Math.round((riskCount / entries.length) * 100)
        : 0;

      // 6. Average streak (simplified: avg entries per unique employee)
      const employeeEntryMap: Record<string, string[]> = {};
      entries.forEach(e => {
        if (!employeeEntryMap[e.employee_id]) employeeEntryMap[e.employee_id] = [];
        employeeEntryMap[e.employee_id].push(e.entry_date);
      });
      
      let totalStreaks = 0;
      let streakEmployees = 0;
      Object.values(employeeEntryMap).forEach(dates => {
        const sorted = [...new Set(dates)].sort();
        let maxStreak = 1, currentStreak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
          if (diff === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
          else { currentStreak = 1; }
        }
        totalStreaks += maxStreak;
        streakEmployees++;
      });
      const avgStreak = streakEmployees > 0 ? Math.round((totalStreaks / streakEmployees) * 10) / 10 : 0;

      // 7. Mood distribution with percentages
      const levelCounts: Record<string, number> = {};
      entries.forEach(e => { levelCounts[e.mood_level] = (levelCounts[e.mood_level] ?? 0) + 1; });
      const moodDistribution = Object.entries(levelCounts)
        .map(([level, count]) => ({
          level,
          count,
          percentage: entries.length > 0 ? Math.round((count / entries.length) * 100) : 0,
        }));

      // 8. Daily trend with response counts
      const dailyMap: Record<string, { total: number; count: number }> = {};
      entries.forEach(e => {
        if (!dailyMap[e.entry_date]) dailyMap[e.entry_date] = { total: 0, count: 0 };
        dailyMap[e.entry_date].total += e.mood_score;
        dailyMap[e.entry_date].count += 1;
      });

      // Get response counts per day
      const { data: responses } = await supabase
        .from('employee_responses')
        .select('responded_at')
        .gte('responded_at', `${startDate}T00:00:00`)
        .lte('responded_at', `${today}T23:59:59`);

      const responseDailyMap: Record<string, number> = {};
      (responses ?? []).forEach(r => {
        if (r.responded_at) {
          const d = r.responded_at.slice(0, 10);
          responseDailyMap[d] = (responseDailyMap[d] ?? 0) + 1;
        }
      });

      // Fill all days in range
      const allDays = eachDayOfInterval({ start: subDays(new Date(), timeRange), end: new Date() });
      const moodTrend = allDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const entry = dailyMap[dateStr];
        return {
          date: dateStr,
          avg: entry ? Math.round((entry.total / entry.count) * 10) / 10 : 0,
          count: entry?.count ?? 0,
          responseCount: responseDailyMap[dateStr] ?? 0,
        };
      });

      // 9. Survey response rate
      const { count: totalScheduled } = await supabase
        .from('scheduled_questions')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_delivery', `${startDate}T00:00:00`);

      const { count: answeredCount } = await supabase
        .from('employee_responses')
        .select('id', { count: 'exact', head: true })
        .gte('responded_at', `${startDate}T00:00:00`);

      const surveyResponseRate = (totalScheduled ?? 0) > 0
        ? Math.round(((answeredCount ?? 0) / (totalScheduled ?? 1)) * 100)
        : 0;

      // 10. Category scores - fetch responses with question details
      const { data: catResponses } = await supabase
        .from('employee_responses')
        .select('answer_value, question_id')
        .gte('responded_at', `${startDate}T00:00:00`)
        .lte('responded_at', `${today}T23:59:59`);

      // Get question metadata
      const questionIds = [...new Set((catResponses ?? []).map(r => r.question_id))];
      let categoryScores: CategoryScore[] = [];
      let subcategoryScores: SubcategoryScore[] = [];
      let affectiveDistribution: AffectiveDistribution[] = [];

      if (questionIds.length > 0) {
        const { data: questions } = await supabase
          .from('questions')
          .select('id, category_id, subcategory_id, affective_state')
          .in('id', questionIds);

        const questionMap = new Map((questions ?? []).map(q => [q.id, q]));

        // Fetch categories
        const categoryIds = [...new Set((questions ?? []).map(q => q.category_id).filter(Boolean))] as string[];
        const { data: categories } = categoryIds.length > 0
          ? await supabase.from('question_categories').select('id, name, name_ar, color').in('id', categoryIds)
          : { data: [] };

        const categoryMap = new Map((categories ?? []).map(c => [c.id, c]));

        // Fetch subcategories
        const subcategoryIds = [...new Set((questions ?? []).map(q => q.subcategory_id).filter(Boolean))] as string[];
        const { data: subcategories } = subcategoryIds.length > 0
          ? await supabase.from('question_subcategories').select('id, name, name_ar, color, category_id').in('id', subcategoryIds)
          : { data: [] };

        const subcategoryMap = new Map((subcategories ?? []).map(s => [s.id, s]));

        // Aggregate by category
        const catAgg: Record<string, { total: number; count: number }> = {};
        const subAgg: Record<string, { total: number; count: number }> = {};
        const affAgg: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };

        (catResponses ?? []).forEach(r => {
          const q = questionMap.get(r.question_id);
          if (!q) return;

          const numVal = typeof r.answer_value === 'number' ? r.answer_value
            : typeof r.answer_value === 'string' ? parseFloat(r.answer_value)
            : null;

          if (q.category_id && numVal !== null && !isNaN(numVal)) {
            if (!catAgg[q.category_id]) catAgg[q.category_id] = { total: 0, count: 0 };
            catAgg[q.category_id].total += numVal;
            catAgg[q.category_id].count += 1;
          }

          if (q.subcategory_id && numVal !== null && !isNaN(numVal)) {
            if (!subAgg[q.subcategory_id]) subAgg[q.subcategory_id] = { total: 0, count: 0 };
            subAgg[q.subcategory_id].total += numVal;
            subAgg[q.subcategory_id].count += 1;
          }

          if (q.affective_state && affAgg.hasOwnProperty(q.affective_state)) {
            affAgg[q.affective_state]++;
          }
        });

        categoryScores = Object.entries(catAgg)
          .map(([id, { total, count }]) => {
            const cat = categoryMap.get(id);
            return {
              id,
              name: cat?.name ?? 'Unknown',
              nameAr: cat?.name_ar ?? null,
              color: cat?.color ?? '#3B82F6',
              avgScore: Math.round((total / count) * 10) / 10,
              responseCount: count,
            };
          })
          .sort((a, b) => a.avgScore - b.avgScore); // worst first

        subcategoryScores = Object.entries(subAgg)
          .map(([id, { total, count }]) => {
            const sub = subcategoryMap.get(id);
            const parentCat = sub?.category_id ? categoryMap.get(sub.category_id) : null;
            return {
              id,
              name: sub?.name ?? 'Unknown',
              nameAr: sub?.name_ar ?? null,
              color: sub?.color ?? '#3B82F6',
              categoryName: parentCat?.name ?? 'Unknown',
              categoryNameAr: parentCat?.name_ar ?? null,
              avgScore: Math.round((total / count) * 10) / 10,
              responseCount: count,
            };
          })
          .sort((a, b) => a.avgScore - b.avgScore);

        const totalAff = affAgg.positive + affAgg.neutral + affAgg.negative;
        affectiveDistribution = (['positive', 'neutral', 'negative'] as const).map(state => ({
          state,
          count: affAgg[state],
          percentage: totalAff > 0 ? Math.round((affAgg[state] / totalAff) * 100) : 0,
        }));
      }

      // 11. Day-of-week activity
      const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
      (responses ?? []).forEach(r => {
        if (r.responded_at) {
          const dow = getDay(new Date(r.responded_at));
          dowCounts[dow]++;
        }
      });
      // Also count mood entries
      entries.forEach(e => {
        const dow = getDay(new Date(e.entry_date));
        dowCounts[dow]++;
      });

      const dayOfWeekActivity: DayOfWeekActivity[] = dowCounts.map((count, day) => ({ day, count }));

      return {
        activeEmployees: totalActive,
        avgMoodScore,
        participationRate,
        surveyResponseRate,
        riskPercentage,
        avgStreak,
        moodTrend,
        moodDistribution,
        categoryScores,
        subcategoryScores,
        affectiveDistribution,
        dayOfWeekActivity,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { data, isLoading };
}
