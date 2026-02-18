import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Question } from './useQuestions';

/**
 * Fetches questions from the questions bank that are tagged for a specific mood level.
 * Replaces the old generate-mood-questions edge function call.
 */
export function useMoodPathwayQuestions(
  moodLevel: string | null,
  tenantId: string | null,
  maxQuestions = 2,
) {
  return useQuery({
    queryKey: ['mood-pathway-questions', moodLevel, tenantId],
    queryFn: async (): Promise<Question[]> => {
      if (!moodLevel || !tenantId) return [];

      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          category:question_categories (
            id,
            name,
            name_ar,
            color,
            icon
          )
        `)
        .is('deleted_at', null)
        .eq('is_active', true)
        .contains('mood_levels', JSON.stringify([moodLevel]));

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Pick up to maxQuestions randomly for rotation effect
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, maxQuestions) as Question[];
    },
    enabled: !!moodLevel && !!tenantId,
    staleTime: 0, // Always re-fetch so rotation works
  });
}
