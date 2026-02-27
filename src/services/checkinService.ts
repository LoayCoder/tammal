/**
 * Check-in Service — handles mood entry submission and related operations.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';
import { calculatePoints } from './gamificationService';

export interface CheckinParams {
  tenantId: string;
  employeeId: string;
  userId: string;
  moodLevel: string;
  moodScore: number;
  comment?: string | null;
  supportActions?: string[];
  answerValue?: Record<string, unknown> | null;
  currentStreak: number;
  entryDate: string;
  language?: string;
  pathwayAnswers?: { theme: string; selectedOption?: string; answer?: string; freeText?: string }[];
}

export interface CheckinResult {
  tip: string;
  pointsEarned: number;
  newStreak: number;
  alreadySubmitted: boolean;
}

/**
 * Fetch today's existing mood entry for an employee.
 */
export async function fetchTodayEntry(employeeId: string, date: string) {
  const { data, error } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('entry_date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Generate an AI wellness tip (optional — failure is non-fatal).
 */
export async function generateDailyTip(
  moodLevel: string,
  pathwayAnswers: CheckinParams['pathwayAnswers'],
  language: string
): Promise<string> {
  try {
    const { data } = await supabase.functions.invoke('generate-daily-tip', {
      body: { moodLevel, pathwayAnswers: pathwayAnswers || [], language },
    });
    return data?.tip || '';
  } catch {
    return '';
  }
}

/**
 * Submit a mood entry + points transaction.
 * Returns { alreadySubmitted: true } if unique constraint is violated.
 */
export async function submitMoodEntry(params: CheckinParams): Promise<CheckinResult> {
  const {
    tenantId, employeeId, userId, moodLevel, moodScore,
    comment, supportActions, answerValue, currentStreak, entryDate,
    language, pathwayAnswers,
  } = params;

  // 1. Generate AI tip (optional)
  const tip = await generateDailyTip(moodLevel, pathwayAnswers, language || 'en');

  // 2. Calculate points based on streak BEFORE today
  const points = calculatePoints(currentStreak);
  const newStreak = currentStreak + 1;

  // 3. Insert mood entry
  const { error: moodError } = await supabase
    .from('mood_entries' as any)
    .insert({
      tenant_id: tenantId,
      employee_id: employeeId,
      mood_level: moodLevel,
      mood_score: moodScore,
      answer_value: answerValue ?? null,
      answer_text: comment || null,
      ai_tip: tip || null,
      support_actions: supportActions || [],
      points_earned: points,
      streak_count: newStreak,
      entry_date: entryDate,
    });

  if (moodError) {
    // Check for unique violation (23505) — already submitted
    if (moodError.code === '23505') {
      return { tip: '', pointsEarned: 0, newStreak: currentStreak, alreadySubmitted: true };
    }
    throw moodError;
  }

  // 4. Insert into points ledger
  const { error: ptError } = await supabase
    .from('points_transactions')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      amount: points,
      source_type: 'daily_checkin',
      status: 'credited',
      description: 'Daily check-in streak reward',
    });

  if (ptError) {
    // Log but don't throw — mood entry already succeeded
    console.warn('Points ledger insert failed:', ptError.message);
  }

  return { tip, pointsEarned: points, newStreak, alreadySubmitted: false };
}
