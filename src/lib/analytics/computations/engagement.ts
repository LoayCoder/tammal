// ── Engagement computations ──
// Pure functions, no Supabase, no React.

import { getDay } from 'date-fns';
import type { MoodEntry, DayOfWeekActivity, CheckinByOrgUnitItem, OrgComparison } from '../types';

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

export function computeCheckinByOrgUnit(orgComparison: OrgComparison): CheckinByOrgUnitItem[] {
  return orgComparison.departments.map(d => ({
    id: d.id,
    name: d.name,
    nameAr: d.nameAr,
    avgScore: d.avgScore,
    entryCount: d.employeeCount,
  })).filter(d => d.avgScore > 0).sort((a, b) => a.avgScore - b.avgScore);
}
