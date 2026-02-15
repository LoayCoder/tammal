import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDailyWellnessQuestions } from '@/hooks/useDailyWellnessQuestions';
import { useGamification } from '@/hooks/useGamification';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useCheckinScheduledQuestions } from '@/hooks/useCheckinScheduledQuestions';
import { useEmployeeResponses } from '@/hooks/useEmployeeResponses';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Flame, Star, Loader2 } from 'lucide-react';
import { MoodStep, MOODS } from '@/components/checkin/MoodStep';
import { WellnessQuestionStep } from '@/components/checkin/WellnessQuestionStep';
import { ScheduledQuestionsStep, type ScheduledAnswer } from '@/components/checkin/ScheduledQuestionsStep';
import { SupportStep } from '@/components/checkin/SupportStep';
import { CheckinSuccess } from '@/components/checkin/CheckinSuccess';

type Step = 'mood' | 'wellness' | 'scheduled' | 'support' | 'submitting';

export default function DailyCheckin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { employee } = useCurrentEmployee();
  const tenantId = employee?.tenant_id || null;
  const { question, isLoading: questionLoading } = useDailyWellnessQuestions(tenantId);
  const { streak, totalPoints, calculatePoints } = useGamification(employee?.id || null);
  const { questions: scheduledQuestions, isLoading: scheduledLoading } = useCheckinScheduledQuestions(employee?.id);
  const { submitResponse } = useEmployeeResponses(employee?.id);

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [wellnessAnswer, setWellnessAnswer] = useState<unknown>(null);
  const [scheduledAnswers, setScheduledAnswers] = useState<ScheduledAnswer[]>([]);
  const [supportActions, setSupportActions] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const moodObj = MOODS.find(m => m.level === selectedMood);
  const showSupport = selectedMood === 'struggling' || selectedMood === 'need_help';
  const hasScheduledQuestions = scheduledQuestions.length > 0;

  const handleMoodSelected = (mood: string) => {
    setSelectedMood(mood);
  };

  const advanceFromMood = () => {
    if (question || questionLoading) {
      setStep('wellness');
    } else if (hasScheduledQuestions) {
      setStep('scheduled');
    } else {
      setStep('support');
    }
  };

  const advanceFromWellness = () => {
    if (hasScheduledQuestions) {
      setStep('scheduled');
    } else {
      setStep('support');
    }
  };

  const advanceFromScheduled = () => {
    setStep('support');
  };

  const toggleSupportAction = (key: string) => {
    setSupportActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !employee || !moodObj) return;
    setSubmitting(true);

    try {
      // 1. Generate AI tip
      let tip = '';
      try {
        const { data } = await supabase.functions.invoke('generate-daily-tip', {
          body: {
            moodLevel: selectedMood,
            questionText: question?.question_text || '',
            answerValue: wellnessAnswer,
            language: document.documentElement.lang || 'en',
          },
        });
        tip = data?.tip || '';
      } catch { /* tip is optional */ }

      // 2. Calculate points
      const points = calculatePoints(streak);

      // 3. Insert mood entry
      const { error: moodError } = await supabase
        .from('mood_entries' as any)
        .insert({
          tenant_id: employee.tenant_id,
          employee_id: employee.id,
          mood_level: selectedMood,
          mood_score: moodObj.score,
          question_id: question?.question_id || null,
          answer_value: wellnessAnswer,
          answer_text: comment || null,
          ai_tip: tip || null,
          support_actions: supportActions,
          points_earned: points,
          streak_count: streak + 1,
          entry_date: new Date().toISOString().split('T')[0],
        });

      if (moodError) throw moodError;

      // 4. Submit scheduled question responses
      const answeredQuestions = scheduledAnswers.filter(a => !a.skipped && a.answerValue !== null);
      const skippedQuestions = scheduledAnswers.filter(a => a.skipped);

      for (const ans of answeredQuestions) {
        await submitResponse.mutateAsync({
          scheduledQuestionId: ans.scheduledQuestionId,
          answerValue: ans.answerValue,
          answerText: ans.answerText,
          responseTimeSeconds: ans.responseTimeSeconds,
          deviceType: 'web',
        });
      }

      // Mark skipped questions
      for (const ans of skippedQuestions) {
        await supabase
          .from('scheduled_questions')
          .update({ status: 'skipped' })
          .eq('id', ans.scheduledQuestionId);
      }

      // 5. Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-scheduled-questions'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-questions'] });

      setAiTip(tip);
      setSubmitted(true);
      toast({ title: `🎉 +${points} ${t('wellness.points')}!` });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <CheckinSuccess
        streak={streak + 1}
        totalPoints={totalPoints + calculatePoints(streak)}
        aiTip={aiTip}
      />
    );
  }

  return (
    <div className="container mx-auto max-w-lg py-8 px-4 space-y-6">
      {/* Streak bar */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="gap-1">
          <Flame className="h-3 w-3" /> {streak} {t('wellness.dayStreak')}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Star className="h-3 w-3" /> {totalPoints} {t('wellness.points')}
        </Badge>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['mood', 'wellness', ...(hasScheduledQuestions ? ['scheduled'] : []), 'support'].map((s, i) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s === step ? 'bg-primary' :
              getStepOrder(s) < getStepOrder(step) ? 'bg-primary/40' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Mood */}
      {step === 'mood' && (
        <>
          <MoodStep selectedMood={selectedMood} onSelect={handleMoodSelected} />
          {selectedMood && (
            <Button className="w-full" size="lg" onClick={advanceFromMood}>
              {t('common.next')}
            </Button>
          )}
        </>
      )}

      {/* Step 2: Wellness Question */}
      {step === 'wellness' && (
        <>
          <WellnessQuestionStep
            question={question}
            isLoading={questionLoading}
            answerValue={wellnessAnswer}
            onAnswerChange={setWellnessAnswer}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('mood')}>{t('common.back')}</Button>
            <Button className="flex-1" onClick={advanceFromWellness}>{t('common.next')}</Button>
          </div>
        </>
      )}

      {/* Step 3: Scheduled Questions */}
      {step === 'scheduled' && (
        <>
          <ScheduledQuestionsStep
            questions={scheduledQuestions}
            answers={scheduledAnswers}
            onAnswersChange={setScheduledAnswers}
            onComplete={advanceFromScheduled}
          />
        </>
      )}

      {/* Step 4: Support & Comment */}
      {step === 'support' && (
        <>
          <SupportStep
            showSupport={showSupport}
            supportActions={supportActions}
            onToggleAction={toggleSupportAction}
            comment={comment}
            onCommentChange={setComment}
          />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => {
              if (hasScheduledQuestions) setStep('scheduled');
              else if (question) setStep('wellness');
              else setStep('mood');
            }}>
              {t('common.back')}
            </Button>
            <Button className="flex-1" size="lg" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              {t('wellness.submitCheckin')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function getStepOrder(step: string): number {
  const order: Record<string, number> = { mood: 0, wellness: 1, scheduled: 2, support: 3 };
  return order[step] ?? -1;
}
