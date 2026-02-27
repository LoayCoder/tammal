import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { updateMoodTags, unlinkQuestionFromMood } from '@/services/moodTaggingService';

export function useMoodTagging(questions: { id: string; mood_levels?: string[] }[]) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const getTaggedQuestions = (moodLevel: string) => {
    return questions.filter(q => {
      const levels = (q as any).mood_levels;
      return Array.isArray(levels) && levels.includes(moodLevel);
    });
  };

  const saveTags = async (selectedIds: string[], moodLevel: string) => {
    setIsSaving(true);
    try {
      const wasTagged = getTaggedQuestions(moodLevel).map(q => q.id);
      const toUntagIds = wasTagged.filter(id => !selectedIds.includes(id));
      const toTagIds = selectedIds.filter(id => !wasTagged.includes(id));

      const toUntag = toUntagIds.map(id => {
        const q = questions.find(q => q.id === id);
        return { id, currentLevels: ((q as any)?.mood_levels || []) as string[] };
      }).filter(item => item !== null);

      const toTag = toTagIds.map(id => {
        const q = questions.find(q => q.id === id);
        return { id, currentLevels: ((q as any)?.mood_levels || []) as string[] };
      }).filter(item => item !== null);

      await updateMoodTags(moodLevel, toTag, toUntag);

      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['mood-pathway-questions'] });
      toast.success(t('moodPathway.tagsSaved'));
    } catch {
      toast.error(t('moodPathway.tagsFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const unlinkQuestion = async (questionId: string, moodLevel: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    const currentLevels = ((q as any).mood_levels || []) as string[];

    await unlinkQuestionFromMood(questionId, moodLevel, currentLevels);
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['mood-pathway-questions'] });
    toast.success(t('moodPathway.questionUnlinked'));
  };

  return { getTaggedQuestions, saveTags, unlinkQuestion, isSaving };
}
