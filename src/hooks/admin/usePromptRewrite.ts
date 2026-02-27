import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { rewritePrompt as rewritePromptService, type RewritePromptParams } from '@/services/aiService';

export function usePromptRewrite() {
  const { t } = useTranslation();
  const [isRewriting, setIsRewriting] = useState(false);

  const rewritePrompt = async (params: RewritePromptParams): Promise<string | null> => {
    setIsRewriting(true);
    try {
      const result = await rewritePromptService(params);

      if (!result.success) {
        if (result.error?.includes('Rate limit')) {
          toast.error(t('aiGenerator.rateLimitError'));
        } else if (result.error?.includes('Payment required') || result.error?.includes('credits')) {
          toast.error(t('aiGenerator.creditsError'));
        } else {
          throw new Error(result.error);
        }
        return null;
      }

      toast.success(t('aiGenerator.rewriteSuccess'));
      return result.rewrittenPrompt || null;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('aiGenerator.rewriteError');
      toast.error(message);
      return null;
    } finally {
      setIsRewriting(false);
    }
  };

  return { rewritePrompt, isRewriting };
}
