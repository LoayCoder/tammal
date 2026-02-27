import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { rewriteQuestion as rewriteQuestionService, type RewriteQuestionParams } from '@/services/aiService';

export function useQuestionRewrite() {
  const { t } = useTranslation();
  const [isRewriting, setIsRewriting] = useState(false);

  const rewriteQuestion = async (params: RewriteQuestionParams): Promise<{ question_text: string; question_text_ar: string } | null> => {
    setIsRewriting(true);
    try {
      const result = await rewriteQuestionService(params);

      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      toast.success(t('aiGenerator.rewriteSuccess'));
      return {
        question_text: result.question_text!,
        question_text_ar: result.question_text_ar!,
      };
    } catch (err: unknown) {
      console.error('Rewrite error:', err);
      toast.error(t('aiGenerator.rewriteError'));
      return null;
    } finally {
      setIsRewriting(false);
    }
  };

  return { rewriteQuestion, isRewriting };
}
