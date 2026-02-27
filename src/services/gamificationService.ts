/**
 * Gamification Service — Single Source of Truth
 *
 * Canonical decisions:
 * - Source table: mood_entries.entry_date (DATE column, NOT created_at)
 * - UTC normalization: entry_date is parsed as 'YYYY-MM-DD' in UTC
 * - Streak semantics: consecutive days ending at today; if today has no entry the chain starts from yesterday
 * - Points formula: calculatePoints(streakBeforeToday) — reward = base 10 + bonus for prior streak
 */

import { supabase } from '@/integrations/supabase/client';

// ── Pure computation (no DB) ──

/**
 * Points awarded for a check-in, based on the streak length BEFORE today's entry.
 * Formula: 10 (base) + min(streak * 5, 50) bonus.
 */
export function calculatePoints(streakBeforeToday: number): number {
  return 10 + Math.min(streakBeforeToday * 5, 50);
}

/**
 * Compute the current streak from a list of entries sorted by entry_date DESC.
 * Each entry must have an `entry_date` string in 'YYYY-MM-DD' format.
 */
export function computeStreak(entries: { entry_date: string }[]): number {
  if (!entries || entries.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  for (let i = 0; i < entries.length; i++) {
    const [y, m, d] = entries[i].entry_date.split('-').map(Number);
    const entryUTC = Date.UTC(y, m - 1, d);
    const expectedUTC = todayUTC - i * 86400000; // i days ago

    if (entryUTC === expectedUTC) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Sum all points_earned values from entries.
 */
export function computeTotalPoints(entries: { points_earned: number | null }[]): number {
  return entries.reduce((sum, e) => sum + (e.points_earned || 0), 0);
}

// ── DB-backed fetch ──

/**
 * Fetch gamification data (streak + totalPoints) for an employee.
 */
export async function fetchGamificationData(
  employeeId: string
): Promise<{ streak: number; totalPoints: number }> {
  const { data: entries, error } = await supabase
    .from('mood_entries')
    .select('entry_date, points_earned')
    .eq('employee_id', employeeId)
    .order('entry_date', { ascending: false })
    .limit(60);

  if (error) throw error;
  if (!entries || entries.length === 0) return { streak: 0, totalPoints: 0 };

  const streak = computeStreak(entries);
  const totalPoints = computeTotalPoints(entries);

  return { streak, totalPoints };
}
