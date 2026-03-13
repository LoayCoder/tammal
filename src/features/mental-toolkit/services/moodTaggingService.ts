/**
 * Mood Tagging Service — handles tagging/untagging questions with mood levels.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Update mood_levels tags for a batch of questions.
 * `toTag` are question IDs to add `moodLevel` to.
 * `toUntag` are question IDs to remove `moodLevel` from.
 */
export async function updateMoodTags(
  moodLevel: string,
  toTag: { id: string; currentLevels: string[] }[],
  toUntag: { id: string; currentLevels: string[] }[]
): Promise<void> {
  for (const item of toUntag) {
    const updated = item.currentLevels.filter((l: string) => l !== moodLevel);
    await supabase.from('questions').update({ mood_levels: updated } as any).eq('id', item.id);
  }

  for (const item of toTag) {
    if (!item.currentLevels.includes(moodLevel)) {
      await supabase.from('questions').update({ mood_levels: [...item.currentLevels, moodLevel] } as any).eq('id', item.id);
    }
  }
}

/**
 * Unlink a single question from a mood level.
 */
export async function unlinkQuestionFromMood(
  questionId: string,
  moodLevel: string,
  currentLevels: string[]
): Promise<void> {
  const updated = currentLevels.filter((l: string) => l !== moodLevel);
  await supabase.from('questions').update({ mood_levels: updated } as any).eq('id', questionId);
}
