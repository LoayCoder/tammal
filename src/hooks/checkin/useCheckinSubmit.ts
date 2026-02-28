import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { submitMoodEntry, type CheckinParams, type CheckinResult } from '@/services/checkinService';
import { DuplicateCheckinError } from '@/services/errors';

export function useCheckinSubmit() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCheckin = async (params: CheckinParams): Promise<CheckinResult | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitMoodEntry(params);

      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['mood-entry-today'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });

      return result;
    } catch (err: unknown) {
      if (err instanceof DuplicateCheckinError) {
        toast.info(t('wellness.alreadyCheckedIn', 'Already checked in today'));
        return null;
      }
      const message = err instanceof Error ? err.message : t('common.error');
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitCheckin, isSubmitting, error };
}
