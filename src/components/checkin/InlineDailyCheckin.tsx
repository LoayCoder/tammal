import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDailyWellnessQuestions } from '@/hooks/useDailyWellnessQuestions';
import { useGamification } from '@/hooks/useGamification';
import { useCheckinScheduledQuestions } from '@/hooks/useCheckinScheduledQuestions';
import { useEmployeeResponses } from '@/hooks/useEmployeeResponses';
import {
  Flame, Star, Loader2, ArrowRight, ArrowLeft, Send, AlertCircle, RefreshCw,
} from 'lucide-react';
import { MoodStep, MOODS } from '@/components/checkin/MoodStep';
import { WellnessQuestionStep } from '@/components/checkin/WellnessQuestionStep';
import { ScheduledQuestionsStep, type ScheduledAnswer } from '@/components/checkin/ScheduledQuestionsStep';
import { SupportStep } from '@/components/checkin/SupportStep';
import { AchievementOverlay } from '@/components/checkin/AchievementOverlay';

type Step = 'mood' | 'wellness' | 'scheduled' | 'support';

interface InlineDailyCheckinProps {
  employeeId: string;
  tenantId: string;
}

export function InlineDailyCheckin({ employeeId, tenantId }: InlineDailyCheckinProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { question, isLoading: questionLoading } = useDailyWellnessQuestions(tenantId);
  const { streak, totalPoints, calculatePoints } = useGamification(employeeId);

  const dailyWellnessQuestionId = question?.question_id || undefined;
  const { questions: scheduledQuestions, isLoading: scheduledLoading } = useCheckinScheduledQuestions(employeeId, dailyWellnessQuestionId);
  const { submitResponse } = useEmployeeResponses(employeeId);

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

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [wellnessAnswer, setWellnessAnswer] = useState<unknown>(null);
  const [scheduledAnswers, setScheduledAnswers] = useState<ScheduledAnswer[]>([]);
  const [supportActions, setSupportActions] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{ streak: number; points: number; tip: string | null }>({ streak: 0, points: 0, tip: null });

  const moodObj = MOODS.find(m => m.level === selectedMood);
  const showSupport = selectedMood === 'struggling' || selectedMood === 'need_help';
  const hasScheduledQuestions = scheduledQuestions.length > 0;

  const steps = ['mood', 'wellness', ...(hasScheduledQuestions ? ['scheduled'] : []), 'support'];
  const stepLabels: Record<string, string> = {
    mood: t('wellness.mood.title', 'Mood'),
    wellness: t('wellness.dailyQuestion', 'Question'),
    scheduled: t('wellness.scheduledQuestion', 'Survey'),
    support: t('wellness.submitCheckin', 'Submit'),
  };

  const handleMoodSelected = (mood: string) => {
    setSelectedMood(mood);
    setTimeout(() => {
      if (question || questionLoading) setStep('wellness');
      else if (hasScheduledQuestions) setStep('scheduled');
      else setStep('support');
    }, 400);
  };

  const advanceFromMood = () => {
    if (question || questionLoading) setStep('wellness');
    else if (hasScheduledQuestions) setStep('scheduled');
    else setStep('support');
  };
  const advanceFromWellness = () => hasScheduledQuestions ? setStep('scheduled') : setStep('support');
  const advanceFromScheduled = () => setStep('support');

  const goBack = () => {
    if (step === 'support') {
      if (hasScheduledQuestions) setStep('scheduled');
      else if (question) setStep('wellness');
      else setStep('mood');
    } else if (step === 'scheduled') {
      question ? setStep('wellness') : setStep('mood');
    } else if (step === 'wellness') {
      setStep('mood');
    }
  };

  const toggleSupportAction = (key: string) => {
    setSupportActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

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
          body: { moodLevel: selectedMood, questionText: question?.question_text || '', answerValue: wellnessAnswer, language: document.documentElement.lang || 'en' },
        });
        tip = data?.tip || '';
      } catch { /* tip is optional */ }

      const points = calculatePoints(streak);

      const { error: moodError } = await supabase
        .from('mood_entries' as any)
        .insert({
          tenant_id: tenantId, employee_id: employeeId, mood_level: selectedMood, mood_score: moodObj.score,
          question_id: question?.question_id || null, answer_value: wellnessAnswer, answer_text: comment || null,
          ai_tip: tip || null, support_actions: supportActions, points_earned: points, streak_count: streak + 1,
          entry_date: today,
        });
      if (moodError) throw moodError;

      const answeredQuestions = scheduledAnswers.filter(a => !a.skipped && a.answerValue !== null);
      const skippedQuestions = scheduledAnswers.filter(a => a.skipped);

      for (const ans of answeredQuestions) {
        await submitResponse.mutateAsync({
          scheduledQuestionId: ans.scheduledQuestionId, answerValue: ans.answerValue,
          answerText: ans.answerText, responseTimeSeconds: ans.responseTimeSeconds, deviceType: 'web',
        });
      }

      for (const ans of skippedQuestions) {
        await supabase.from('scheduled_questions').update({ status: 'skipped' }).eq('id', ans.scheduledQuestionId);
      }

      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-scheduled-questions'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-questions'] });
      queryClient.invalidateQueries({ queryKey: ['mood-entry-today'] });
      queryClient.invalidateQueries({ queryKey: ['mood-history'] });

      setAchievementData({ streak: streak + 1, points, tip });
      setShowAchievement(true);

      // Reset form
      setStep('mood');
      setSelectedMood(null);
      setWellnessAnswer(null);
      setScheduledAnswers([]);
      setSupportActions([]);
      setComment('');
    } catch (err: any) {
      setSubmitError(err.message || t('common.error'));
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (entryLoading) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  // Already checked in — show nothing (card in EmployeeHome handles this)
  if (todayEntry) {
    return null;
  }

  const currentStepIndex = steps.indexOf(step);

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

      <Card className="border-2 border-primary/20 bg-primary/5 overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">{t('wellness.dailyCheckin', 'Daily Check-in')}</h3>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1 px-2 py-1 rounded-full text-xs">
                <Flame className="h-3 w-3 text-chart-4" /> {streak}
              </Badge>
              <Badge variant="outline" className="gap-1 px-2 py-1 rounded-full text-xs">
                <Star className="h-3 w-3 text-chart-1" /> {totalPoints}
              </Badge>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= currentStepIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Steps */}
          <div className="transition-all duration-300 ease-in-out">
            {step === 'mood' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-end-4 duration-300">
                <MoodStep selectedMood={selectedMood} onSelect={handleMoodSelected} />
                {selectedMood && (
                  <Button className="w-full rounded-xl h-10 text-sm gap-2" onClick={advanceFromMood}>
                    {t('common.next')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                )}
              </div>
            )}

            {step === 'wellness' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-end-4 duration-300">
                <WellnessQuestionStep
                  question={question}
                  isLoading={questionLoading}
                  answerValue={wellnessAnswer}
                  onAnswerChange={setWellnessAnswer}
                  onAutoAdvance={() => setTimeout(advanceFromWellness, 400)}
                />
                <div className="flex gap-3">
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                  <Button className="flex-1 rounded-xl h-10 text-sm gap-2" onClick={advanceFromWellness}>
                    {t('common.next')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'scheduled' && (
              <div className="animate-in fade-in slide-in-from-end-4 duration-300">
                <ScheduledQuestionsStep questions={scheduledQuestions} answers={scheduledAnswers} onAnswersChange={setScheduledAnswers} onComplete={advanceFromScheduled} onBack={goBack} />
              </div>
            )}

            {step === 'support' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-end-4 duration-300">
                <SupportStep showSupport={showSupport} supportActions={supportActions} onToggleAction={toggleSupportAction} comment={comment} onCommentChange={setComment} />

                {submitError && (
                  <Alert variant="destructive" className="rounded-xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span className="text-sm">{submitError}</span>
                      <Button variant="ghost" size="sm" onClick={handleSubmit} className="gap-1 shrink-0">
                        <RefreshCw className="h-3 w-3" /> {t('common.retry', 'Retry')}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3">
                  <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={goBack}>
                    <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                  <Button className="flex-1 rounded-xl h-10 text-sm gap-2 font-semibold" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t('wellness.submitCheckin')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
