import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDailyWellnessQuestions } from '@/hooks/useDailyWellnessQuestions';
import { useGamification } from '@/hooks/useGamification';
import { useCheckinScheduledQuestions } from '@/hooks/useCheckinScheduledQuestions';
import { useEmployeeResponses } from '@/hooks/useEmployeeResponses';
import {
  Flame, Star, Loader2, Send, RefreshCw, MessageCircle,
  ClipboardList, CheckCircle2, SkipForward,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { MoodStep, MOODS } from '@/components/checkin/MoodStep';
import { AchievementOverlay } from '@/components/checkin/AchievementOverlay';
import type { ScheduledAnswer } from '@/components/checkin/ScheduledQuestionsStep';
import type { CheckinScheduledQuestion } from '@/hooks/useCheckinScheduledQuestions';

interface InlineDailyCheckinProps {
  employeeId: string;
  tenantId: string;
}

export function InlineDailyCheckin({ employeeId, tenantId }: InlineDailyCheckinProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.dir() === 'rtl';
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

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [wellnessAnswer, setWellnessAnswer] = useState<unknown>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{ streak: number; points: number; tip: string | null }>({ streak: 0, points: 0, tip: null });

  // Scheduled questions state
  const [sqIndex, setSqIndex] = useState(0);
  const [sqAnswer, setSqAnswer] = useState<unknown>(null);
  const [sqAnswers, setSqAnswers] = useState<ScheduledAnswer[]>([]);
  const [sqStartTime, setSqStartTime] = useState(Date.now());

  const moodObj = MOODS.find(m => m.level === selectedMood);

  const handleDismissAchievement = useCallback(() => {
    setShowAchievement(false);
  }, []);

  // Save current scheduled question answer and advance
  const saveSqAndAdvance = (skipped: boolean, overrideAnswer?: unknown) => {
    const currentQ = scheduledQuestions[sqIndex];
    if (!currentQ?.question) return;
    const finalAnswer = overrideAnswer !== undefined ? overrideAnswer : sqAnswer;
    const entry: ScheduledAnswer = {
      scheduledQuestionId: currentQ.id,
      questionId: currentQ.question.id,
      answerValue: skipped ? null : finalAnswer,
      responseTimeSeconds: Math.floor((Date.now() - sqStartTime) / 1000),
      skipped,
    };
    const updated = [...sqAnswers.filter(a => a.scheduledQuestionId !== currentQ.id), entry];
    setSqAnswers(updated);
    if (sqIndex < scheduledQuestions.length - 1) {
      setSqIndex(prev => prev + 1);
      setSqAnswer(null);
      setSqStartTime(Date.now());
    }
  };

  const sqSelectAndAdvance = (value: unknown) => {
    setSqAnswer(value);
    setTimeout(() => saveSqAndAdvance(false, value), 400);
  };

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
          ai_tip: tip || null, support_actions: [], points_earned: points, streak_count: streak + 1,
          entry_date: today,
        });
      if (moodError) throw moodError;

      // Submit scheduled question answers
      const answeredQuestions = sqAnswers.filter(a => !a.skipped && a.answerValue !== null);
      const skippedQuestions = sqAnswers.filter(a => a.skipped);

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

      // Reset
      setSelectedMood(null);
      setWellnessAnswer(null);
      setSqAnswers([]);
      setSqIndex(0);
      setSqAnswer(null);
      setComment('');
    } catch (err: any) {
      setSubmitError(err.message || t('common.error'));
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (entryLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (todayEntry) return null;

  const currentSQ = scheduledQuestions[sqIndex];
  const allSqAnswered = scheduledQuestions.length === 0 || sqAnswers.length >= scheduledQuestions.length;
  const canSubmit = !!selectedMood && allSqAnswered;

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

      <Card className="border-2 border-primary/20 overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">{t('nav.dailyCheckin')}</h3>
            <div className="flex gap-1.5">
              <Badge variant="outline" className="gap-1 px-2 py-0.5 rounded-full text-xs">
                <Flame className="h-3 w-3 text-chart-4" /> {streak}
              </Badge>
              <Badge variant="outline" className="gap-1 px-2 py-0.5 rounded-full text-xs">
                <Star className="h-3 w-3 text-chart-1" /> {totalPoints}
              </Badge>
            </div>
          </div>

          {/* 1. Mood Selection — always visible */}
          <MoodStep selectedMood={selectedMood} onSelect={setSelectedMood} />

          {/* 2. Wellness Question — show after mood is selected */}
          {selectedMood && (question || questionLoading) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold">{t('wellness.dailyQuestion')}</h4>
              </div>
              {questionLoading ? (
                <Skeleton className="h-20 w-full rounded-xl" />
              ) : question ? (
                <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
                  <p className="font-medium text-sm text-center" dir="auto">{question.question_text}</p>
                  {renderWellnessInput(question, wellnessAnswer, setWellnessAnswer, t)}
                </div>
              ) : null}
            </div>
          )}

          {/* 3. Scheduled Questions — inline one at a time */}
          {selectedMood && scheduledQuestions.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-chart-2/10">
                    <ClipboardList className="h-3.5 w-3.5 text-chart-2" />
                  </div>
                  <h4 className="text-sm font-semibold">{t('wellness.scheduledQuestion')}</h4>
                </div>
                <span className="text-xs text-muted-foreground">{Math.min(sqAnswers.length, scheduledQuestions.length)}/{scheduledQuestions.length}</span>
              </div>
              <Progress value={(sqAnswers.length / scheduledQuestions.length) * 100} className="h-1" />

              {currentSQ?.question && !allSqAnswered && (
                <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
                  {currentSQ.question.category && (
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                        {isRTL && currentSQ.question.category.name_ar ? currentSQ.question.category.name_ar : currentSQ.question.category.name}
                      </Badge>
                    </div>
                  )}
                  <p className="font-medium text-sm text-center" dir="auto">
                    {isRTL && currentSQ.question.text_ar ? currentSQ.question.text_ar : currentSQ.question.text}
                  </p>
                  {renderScheduledInput(currentSQ.question, sqAnswer, setSqAnswer, sqSelectAndAdvance, t)}
                  <div className="flex items-center justify-between pt-1">
                    <Button variant="ghost" size="sm" onClick={() => saveSqAndAdvance(true)} className="text-xs text-muted-foreground gap-1 h-7 px-2">
                      <SkipForward className="h-3 w-3" /> {t('survey.skip')}
                    </Button>
                    <Button size="sm" onClick={() => saveSqAndAdvance(false)} disabled={sqAnswer === null} className="h-7 px-3 text-xs rounded-lg">
                      {sqIndex < scheduledQuestions.length - 1 ? t('common.next') : t('common.done')}
                    </Button>
                  </div>
                </div>
              )}

              {allSqAnswered && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-chart-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">{t('wellness.allCompleted')}</span>
                </div>
              )}
            </div>
          )}

          {/* 4. Optional note — show after mood */}
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
              className="w-full rounded-xl h-11 text-sm gap-2 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300"
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('wellness.submitCheckin')}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}

/* ── Render helpers ── */

function renderWellnessInput(
  question: { question_type: string; options: string[]; question_text: string },
  answerValue: unknown,
  onAnswerChange: (v: unknown) => void,
  t: (key: string) => string,
) {
  if (question.question_type === 'scale' || question.question_type === 'numeric_scale') {
    return (
      <div className="space-y-2 px-1">
        <Slider min={1} max={10} step={1} defaultValue={[5]} onValueChange={v => onAnswerChange(v[0])} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span className="text-base font-bold text-primary">{String(answerValue ?? 5)}</span>
          <span>10</span>
        </div>
      </div>
    );
  }
  if (question.question_type === 'multiple_choice' && question.options?.length > 0) {
    return (
      <RadioGroup onValueChange={v => onAnswerChange(v)} className="space-y-1.5">
        {question.options.map((opt, i) => {
          const isSelected = answerValue === opt;
          return (
            <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-sm ${
              isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}>
              <RadioGroupItem value={opt} id={`wopt-${i}`} />
              <Label htmlFor={`wopt-${i}`} className="cursor-pointer flex-1 text-sm">{opt}</Label>
              {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
          );
        })}
      </RadioGroup>
    );
  }
  if (question.question_type === 'text') {
    return (
      <Textarea
        value={typeof answerValue === 'string' ? answerValue : ''}
        onChange={e => onAnswerChange(e.target.value)}
        placeholder={t('wellness.typeAnswer')}
        className="min-h-[80px] text-sm"
        dir="auto"
      />
    );
  }
  return null;
}

function renderScheduledInput(
  question: { type: string; options: unknown },
  answer: unknown,
  setAnswer: (v: unknown) => void,
  selectAndAdvance: (v: unknown) => void,
  t: (key: string) => string,
) {
  switch (question.type) {
    case 'likert_5':
      return (
        <RadioGroup value={String(answer || '')} onValueChange={v => selectAndAdvance(Number(v))} className="flex justify-between gap-1.5">
          {[1, 2, 3, 4, 5].map(v => (
            <div key={v} className="flex flex-col items-center gap-1.5">
              <RadioGroupItem value={String(v)} id={`sq-l-${v}`} className="h-8 w-8" />
              <Label htmlFor={`sq-l-${v}`} className="text-[10px] text-center text-muted-foreground">
                {v === 1 ? t('survey.stronglyDisagree') : v === 5 ? t('survey.stronglyAgree') : v}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    case 'numeric_scale':
    case 'scale':
      return (
        <div className="space-y-2 px-1">
          <Slider value={[Number(answer) || 5]} onValueChange={([v]) => setAnswer(v)} onValueCommit={([v]) => { setAnswer(v); setTimeout(() => selectAndAdvance(v), 400); }} min={1} max={10} step={1} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span><span className="text-base font-bold text-primary">{String(answer ?? 5)}</span><span>10</span>
          </div>
        </div>
      );
    case 'yes_no':
      return (
        <div className="flex gap-3">
          <Button variant={answer === true ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl" onClick={() => selectAndAdvance(true)}>{t('common.yes')}</Button>
          <Button variant={answer === false ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl" onClick={() => selectAndAdvance(false)}>{t('common.no')}</Button>
        </div>
      );
    case 'multiple_choice':
      if (!question.options || !Array.isArray(question.options)) return null;
      return (
        <RadioGroup onValueChange={v => selectAndAdvance(v)} className="space-y-1.5">
          {(question.options as string[]).map((opt, i) => {
            const isSelected = answer === String(opt);
            return (
              <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-sm ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                <RadioGroupItem value={String(opt)} id={`sq-mc-${i}`} />
                <Label htmlFor={`sq-mc-${i}`} className="cursor-pointer flex-1 text-sm">{String(opt)}</Label>
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
            );
          })}
        </RadioGroup>
      );
    case 'open_ended':
    default:
      return (
        <Textarea
          value={String(answer || '')}
          onChange={e => setAnswer(e.target.value)}
          placeholder={t('survey.typeYourAnswer')}
          className="min-h-[80px] text-sm"
          dir="auto"
        />
      );
  }
}
