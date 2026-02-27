// ── Streak computations for org-wide analytics ──
// Delegates to gamificationService.computeStreak() for consistency.
// Pure functions (no Supabase, no React).

import { computeStreak } from '@/services/gamificationService';
import type { MoodEntry, StreakBucket } from '../types';

/**
 * Compute max streak per employee by delegating to gamificationService.
 * Returns average streak across all employees and a map for distribution.
 */
export function computeStreaks(entries: MoodEntry[]) {
  const employeeEntryMap: Record<string, string[]> = {};
  entries.forEach(e => {
    if (!employeeEntryMap[e.employee_id]) employeeEntryMap[e.employee_id] = [];
    employeeEntryMap[e.employee_id].push(e.entry_date);
  });

  let totalStreaks = 0, streakEmployees = 0;
  Object.values(employeeEntryMap).forEach(dates => {
    const sorted = [...new Set(dates)].sort().reverse(); // DESC for computeStreak
    const streak = computeStreak(sorted.map(d => ({ entry_date: d })));
    totalStreaks += streak;
    streakEmployees++;
  });

  const avgStreak = streakEmployees > 0 ? Math.round((totalStreaks / streakEmployees) * 10) / 10 : 0;
  return { avgStreak, employeeEntryMap };
}

/**
 * Bucket employees by their streak length.
 */
export function computeStreakDistribution(employeeEntryMap: Record<string, string[]>): StreakBucket[] {
  const streakValues = Object.values(employeeEntryMap).map(dates => {
    const sorted = [...new Set(dates)].sort().reverse(); // DESC for computeStreak
    return computeStreak(sorted.map(d => ({ entry_date: d })));
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
