import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export function useReframeSuggestion() {
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);

  const suggest = useCallback(
    async (negativeThought: string, challengeAnswers: Record<string, string>) => {
      setIsPending(true);
      try {
        const { data, error } = await supabase.functions.invoke('suggest-reframe', {
          body: {
            negative_thought: negativeThought,
            challenge_answers: challengeAnswers,
          },
        });
        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          return null;
        }
        return data?.reframed_thought as string | null;
      } catch {
        toast.error(t('mentalToolkit.thoughtReframer.aiSuggestError'));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [t],
  );

  return { suggest, isPending };
}
