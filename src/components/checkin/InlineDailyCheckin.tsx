import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/wellness/useGamification';
import { Flame, Star, Loader2, Send, RefreshCw } from 'lucide-react';
import { MoodStep } from '@/components/checkin/MoodStep';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { AchievementOverlay } from '@/components/checkin/AchievementOverlay';
import { MoodPathwayQuestions, type PathwayAnswer } from '@/components/checkin/MoodPathwayQuestions';

interface InlineDailyCheckinProps {
  employeeId: string;
  tenantId: string;
  userId: string;
}

export function InlineDailyCheckin({ employeeId, tenantId, userId }: InlineDailyCheckinProps) {
  const { t, i18n } = useTranslation();
  
  const queryClient = useQueryClient();
  const { streak, totalPoints, calculatePoints } = useGamification(employeeId);

  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntry, isLoading: entryLoading } = useQuery({
    queryKey: ['mood-entry-today', employeeId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('entry_date', today)
        .maybeSingle();
      return data;
    },
    enabled: !!employeeId,
  });

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [pathwayAnswers, setPathwayAnswers] = useState<PathwayAnswer[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{ streak: number; points: number; tip: string | null }>({ streak: 0, points: 0, tip: null });

  const { moods: moodDefinitions } = useMoodDefinitions(tenantId);
  const moodDef = moodDefinitions?.find(m => m.key === selectedMood);
  const moodObj = moodDef ? { level: moodDef.key, score: moodDef.score } : null;

  const handleDismissAchievement = useCallback(() => {
    setShowAchievement(false);
  }, []);

  const handleSubmit = async () => {
    if (!selectedMood || !moodObj) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let tip = '';
      try {
        const { data } = await supabase.functions.invoke('generate-daily-tip', {
          body: {
            moodLevel: selectedMood,
            pathwayAnswers,
            language: document.documentElement.lang || 'en',
          },
        });
        tip = data?.tip || '';
      } catch { /* tip is optional */ }

      const points = calculatePoints(streak);
      const answerValue = {
        pathway: pathwayAnswers.map(a => ({ theme: a.theme, answer: a.selectedOption, freeText: a.freeText })),
      };

      const { error: moodError } = await supabase
        .from('mood_entries' as any)
        .insert({
          tenant_id: tenantId, employee_id: employeeId, mood_level: selectedMood, mood_score: moodObj.score,
          answer_value: answerValue, answer_text: comment || null,
          ai_tip: tip || null, support_actions: [], points_earned: points, streak_count: streak + 1,
          entry_date: today,
        });
      if (moodError) throw moodError;

      // Bridge check-in points into the recognition points ledger
      const { error: ptError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          amount: points,
          source_type: 'daily_checkin',
          status: 'credited',
          description: `Daily check-in streak reward`,
        });
      if (ptError) console.warn('Points ledger insert failed:', ptError.message);

      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['mood-entry-today'] });
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });

      setAchievementData({ streak: streak + 1, points, tip });
      setShowAchievement(true);

      // Reset
      setSelectedMood(null);
      setComment('');
    } catch (err: any) {
      setSubmitError(err.message || t('common.error'));
      toast.error(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (entryLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (todayEntry) return null;

  return (
    <>
      {showAchievement && (
        <AchievementOverlay
          streak={achievementData.streak}
          points={achievementData.points}
          aiTip={achievementData.tip}
          onDismiss={handleDismissAchievement}
        />
      )}

      <div className="space-y-4">

          {/* 1. Mood Selection — always visible */}
          <MoodStep selectedMood={selectedMood} onSelect={setSelectedMood} />

          {/* 2. Mood Pathway Questions — the single source of follow-up questions */}
          {selectedMood && moodObj && (
            <MoodPathwayQuestions
              moodLevel={selectedMood}
              moodScore={moodObj.score}
              tenantId={tenantId}
              language={i18n.language}
              onAnswersChange={setPathwayAnswers}
            />
          )}

          {/* 3. Optional note — show after mood */}
          {selectedMood && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('wellness.addComment')}
                rows={2}
                className="resize-none text-sm rounded-xl"
                dir="auto"
              />
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl p-3">
              <span className="flex-1">{submitError}</span>
              <Button variant="ghost" size="sm" onClick={handleSubmit} className="gap-1 shrink-0 h-7">
                <RefreshCw className="h-3 w-3" /> {t('common.retry', 'Retry')}
              </Button>
            </div>
          )}

          {/* Submit button */}
          {selectedMood && (
            <Button
              className="w-full rounded-3xl h-11 text-sm gap-2 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ background: 'hsl(259 67% 67%)', color: 'hsl(210 40% 98%)' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('wellness.submitCheckin')}
            </Button>
          )}
        </div>
    </>
  );
}
