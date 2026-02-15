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
import { Flame, Star, Loader2, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import { MoodStep, MOODS } from '@/components/checkin/MoodStep';
import { WellnessQuestionStep } from '@/components/checkin/WellnessQuestionStep';
import { ScheduledQuestionsStep, type ScheduledAnswer } from '@/components/checkin/ScheduledQuestionsStep';
import { SupportStep } from '@/components/checkin/SupportStep';
import { CheckinSuccess } from '@/components/checkin/CheckinSuccess';

type Step = 'mood' | 'wellness' | 'scheduled' | 'support';

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

  const steps = ['mood', 'wellness', ...(hasScheduledQuestions ? ['scheduled'] : []), 'support'];

  const handleMoodSelected = (mood: string) => setSelectedMood(mood);

  const advanceFromMood = () => {
    if (question || questionLoading) setStep('wellness');
    else if (hasScheduledQuestions) setStep('scheduled');
    else setStep('support');
  };

  const advanceFromWellness = () => {
    if (hasScheduledQuestions) setStep('scheduled');
    else setStep('support');
  };

  const advanceFromScheduled = () => setStep('support');

  const goBack = () => {
    if (step === 'support') {
      if (hasScheduledQuestions) setStep('scheduled');
      else if (question) setStep('wellness');
      else setStep('mood');
    } else if (step === 'scheduled') {
      if (question) setStep('wellness');
      else setStep('mood');
    } else if (step === 'wellness') {
      setStep('mood');
    }
  };

  const toggleSupportAction = (key: string) => {
    setSupportActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !employee || !moodObj) return;
    setSubmitting(true);

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
          tenant_id: employee.tenant_id, employee_id: employee.id, mood_level: selectedMood, mood_score: moodObj.score,
          question_id: question?.question_id || null, answer_value: wellnessAnswer, answer_text: comment || null,
          ai_tip: tip || null, support_actions: supportActions, points_earned: points, streak_count: streak + 1,
          entry_date: new Date().toISOString().split('T')[0],
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
    return <CheckinSuccess streak={streak + 1} totalPoints={totalPoints + calculatePoints(streak)} aiTip={aiTip} />;
  }

  return (
    <div className="container mx-auto max-w-md py-8 px-4 space-y-8">
      {/* Header stats */}
      <div className="flex items-center justify-center gap-3">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 rounded-full text-xs">
          <Flame className="h-3.5 w-3.5 text-orange-500" /> {streak} {t('wellness.dayStreak')}
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 rounded-full text-xs">
          <Star className="h-3.5 w-3.5 text-yellow-500" /> {totalPoints} {t('wellness.points')}
        </Badge>
      </div>

      {/* Step progress dots */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all duration-300 ${
              s === step ? 'w-8 bg-primary' :
              getStepOrder(s) < getStepOrder(step) ? 'w-2 bg-primary/50' : 'w-2 bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Steps */}
      {step === 'mood' && (
        <div className="space-y-6">
          <MoodStep selectedMood={selectedMood} onSelect={handleMoodSelected} />
          {selectedMood && (
            <Button className="w-full rounded-xl h-12 text-base gap-2" onClick={advanceFromMood}>
              {t('common.next')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}
        </div>
      )}

      {step === 'wellness' && (
        <div className="space-y-6">
          <WellnessQuestionStep question={question} isLoading={questionLoading} answerValue={wellnessAnswer} onAnswerChange={setWellnessAnswer} />
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button className="flex-1 rounded-xl h-12 text-base gap-2" onClick={advanceFromWellness}>
              {t('common.next')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {step === 'scheduled' && (
        <ScheduledQuestionsStep questions={scheduledQuestions} answers={scheduledAnswers} onAnswersChange={setScheduledAnswers} onComplete={advanceFromScheduled} />
      )}

      {step === 'support' && (
        <div className="space-y-6">
          <SupportStep showSupport={showSupport} supportActions={supportActions} onToggleAction={toggleSupportAction} comment={comment} onCommentChange={setComment} />
          <div className="flex gap-3">
            <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button className="flex-1 rounded-xl h-12 text-base gap-2 font-semibold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('wellness.submitCheckin')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function getStepOrder(step: string): number {
  const order: Record<string, number> = { mood: 0, wellness: 1, scheduled: 2, support: 3 };
  return order[step] ?? -1;
}
