// ── KPI + Mood Distribution computations ──
// Pure functions, no Supabase, no React.

import type { MoodEntry } from '../types';

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

export function computeMoodDistribution(entries: MoodEntry[]) {
  const levelCounts: Record<string, number> = {};
  entries.forEach(e => { levelCounts[e.mood_level] = (levelCounts[e.mood_level] ?? 0) + 1; });
  return Object.entries(levelCounts)
    .map(([level, count]) => ({
      level, count,
      percentage: entries.length > 0 ? Math.round((count / entries.length) * 100) : 0,
    }));
}
