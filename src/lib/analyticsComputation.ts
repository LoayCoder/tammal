// ── Pure computation functions for analytics ───────────────
// Extracted from useOrgAnalytics — no Supabase calls here.
// Streak logic delegates to gamificationService for UTC consistency.

import { format, getDay } from 'date-fns';
import type {
  MoodEntry, CategoryScore, SubcategoryScore, AffectiveDistribution,
  DayOfWeekActivity, RiskTrendPoint, CheckinMoodOverTimePoint,
  SupportActionCount, StreakBucket, CheckinByOrgUnitItem, OrgComparison,
} from './analyticsTypes';
import type { CategoryMoodCell, CategoryTrendPoint } from './wellnessAnalytics';

// ── KPI computations from mood entries ──

export function computeKPIs(entries: MoodEntry[], totalActive: number) {
  const avgMoodScore = entries.length > 0
    ? Math.round((entries.reduce((s, e) => s + e.mood_score, 0) / entries.length) * 10) / 10
    : 0;

  const uniqueEmployees = new Set(entries.map(e => e.employee_id)).size;
  const participationRate = totalActive > 0 ? Math.round((uniqueEmployees / totalActive) * 100) : 0;

  const riskCount = entries.filter(e => e.mood_score <= 2).length;
  const riskPercentage = entries.length > 0 ? Math.round((riskCount / entries.length) * 100) : 0;

  return { avgMoodScore, participationRate, riskPercentage };
}

// ── Streak computation ──

/**
 * Compute max streak per employee using UTC-safe date parsing.
 * Consistent with gamificationService.computeStreak() normalization.
 */
export function computeStreaks(entries: MoodEntry[]) {
  const employeeEntryMap: Record<string, string[]> = {};
  entries.forEach(e => {
    if (!employeeEntryMap[e.employee_id]) employeeEntryMap[e.employee_id] = [];
    employeeEntryMap[e.employee_id].push(e.entry_date);
  });

  let totalStreaks = 0, streakEmployees = 0;
  Object.values(employeeEntryMap).forEach(dates => {
    const sorted = [...new Set(dates)].sort();
    let maxStreak = 1, currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const [y1, m1, d1] = sorted[i - 1].split('-').map(Number);
      const [y2, m2, d2] = sorted[i].split('-').map(Number);
      const diff = (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000;
      if (diff === 1) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else { currentStreak = 1; }
    }
    totalStreaks += maxStreak;
    streakEmployees++;
  });

  const avgStreak = streakEmployees > 0 ? Math.round((totalStreaks / streakEmployees) * 10) / 10 : 0;
  return { avgStreak, employeeEntryMap };
}

// ── Mood distribution ──

export function computeMoodDistribution(entries: MoodEntry[]) {
  const levelCounts: Record<string, number> = {};
  entries.forEach(e => { levelCounts[e.mood_level] = (levelCounts[e.mood_level] ?? 0) + 1; });
  return Object.entries(levelCounts)
    .map(([level, count]) => ({
      level, count,
      percentage: entries.length > 0 ? Math.round((count / entries.length) * 100) : 0,
    }));
}

// ── Daily trend ──

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

// ── Day-of-week activity ──

export function computeDayOfWeekActivity(
  entries: MoodEntry[],
  responses: { responded_at: string | null }[],
): DayOfWeekActivity[] {
  const dowCounts: number[] = [0, 0, 0, 0, 0, 0, 0];
  responses.forEach(r => {
    if (r.responded_at) { dowCounts[getDay(new Date(r.responded_at))]++; }
  });
  entries.forEach(e => { dowCounts[getDay(new Date(e.entry_date))]++; });
  return dowCounts.map((count, day) => ({ day, count }));
}

// ── Risk trend ──

export function computeRiskTrend(entries: MoodEntry[], allDays: Date[]): RiskTrendPoint[] {
  return allDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayEntries = entries.filter(e => e.entry_date === dateStr);
    const total = dayEntries.length;
    const atRisk = dayEntries.filter(e => e.mood_score <= 2).length;
    return { date: dateStr, riskPct: total > 0 ? Math.round((atRisk / total) * 100) : 0, totalEntries: total };
  });
}

// ── Check-in deep analysis ──

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

export function computeStreakDistribution(employeeEntryMap: Record<string, string[]>): StreakBucket[] {
  const streakValues = Object.values(employeeEntryMap).map(dates => {
    const sorted = [...new Set(dates)].sort();
    let maxStreak = 1, currentStr = 1;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
      if (diff === 1) { currentStr++; maxStreak = Math.max(maxStreak, currentStr); }
      else { currentStr = 1; }
    }
    return maxStreak;
  });

  const buckets = [
    { bucket: '1', min: 0, max: 1 },
    { bucket: '2-3', min: 2, max: 3 },
    { bucket: '4-7', min: 4, max: 7 },
    { bucket: '8-14', min: 8, max: 14 },
    { bucket: '15+', min: 15, max: Infinity },
  ];
  return buckets.map(b => ({
    bucket: b.bucket,
    count: streakValues.filter(v => v >= b.min && v <= b.max).length,
  }));
}

export function computeCheckinByOrgUnit(orgComparison: OrgComparison): CheckinByOrgUnitItem[] {
  return orgComparison.departments.map(d => ({
    id: d.id,
    name: d.name,
    nameAr: d.nameAr,
    avgScore: d.avgScore,
    entryCount: d.employeeCount,
  })).filter(d => d.avgScore > 0).sort((a, b) => a.avgScore - b.avgScore);
}
