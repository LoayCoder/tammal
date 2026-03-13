// ── Mood trend computations ──
// Pure functions, no Supabase, no React.

import { format } from 'date-fns';
import type { MoodEntry, CheckinMoodOverTimePoint, SupportActionCount, RiskTrendPoint } from '../types';

export function computeDailyTrend(
  entries: MoodEntry[],
  allDays: Date[],
  responseDailyMap: Record<string, number>,
) {
  const dailyMap: Record<string, { total: number; count: number }> = {};
  entries.forEach(e => {
    if (!dailyMap[e.entry_date]) dailyMap[e.entry_date] = { total: 0, count: 0 };
    dailyMap[e.entry_date].total += e.mood_score;
    dailyMap[e.entry_date].count += 1;
  });

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

  return { moodTrend, dailyMap };
}

export function computeRiskTrend(entries: MoodEntry[], allDays: Date[]): RiskTrendPoint[] {
  return allDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.entry_date === dateStr);
    const total = dayEntries.length;
    const atRisk = dayEntries.filter(e => e.mood_score <= 2).length;
    return { date: dateStr, riskPct: total > 0 ? Math.round((atRisk / total) * 100) : 0, totalEntries: total };
  });
}

export function computeCheckinMoodOverTime(entries: MoodEntry[], allDays: Date[]): CheckinMoodOverTimePoint[] {
  return allDays.map(day => {
    const ds = format(day, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.entry_date === ds);
    return {
      date: ds,
      label: format(day, 'dd/MM'),
      great: dayEntries.filter(e => e.mood_level === 'great').length,
      good: dayEntries.filter(e => e.mood_level === 'good').length,
      okay: dayEntries.filter(e => e.mood_level === 'okay').length,
      struggling: dayEntries.filter(e => e.mood_level === 'struggling').length,
      need_help: dayEntries.filter(e => e.mood_level === 'need_help').length,
    };
  });
}

export function computeSupportActions(entries: MoodEntry[]): SupportActionCount[] {
  const supportMap: Record<string, number> = {};
  entries.forEach(e => {
    if (Array.isArray(e.support_actions)) {
      (e.support_actions as string[]).forEach(a => {
        supportMap[a] = (supportMap[a] ?? 0) + 1;
      });
    }
  });
  return Object.entries(supportMap)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count);
}
