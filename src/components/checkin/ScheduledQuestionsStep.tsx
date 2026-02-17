import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SkipForward, ClipboardList, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { CheckinScheduledQuestion } from '@/hooks/useCheckinScheduledQuestions';

export interface ScheduledAnswer {
  scheduledQuestionId: string;
  questionId: string;
  answerValue: unknown;
  answerText?: string;
  responseTimeSeconds: number;
  skipped: boolean;
}

interface ScheduledQuestionsStepProps {
  questions: CheckinScheduledQuestion[];
  answers: ScheduledAnswer[];
  onAnswersChange: (answers: ScheduledAnswer[]) => void;
  onComplete: () => void;
  onBack?: () => void;
}

export function ScheduledQuestionsStep({ questions, answers, onAnswersChange, onComplete, onBack }: ScheduledQuestionsStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [answerText, setAnswerText] = useState('');
  const [startTime, setStartTime] = useState(Date.now());

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  useEffect(() => {
    setStartTime(Date.now());
    setAnswer(null);
    setAnswerText('');
  }, [currentIndex]);

  const saveAndAdvance = (skipped: boolean, overrideAnswer?: unknown) => {
    if (!currentQ?.question) return;

    const finalAnswer = overrideAnswer !== undefined ? overrideAnswer : answer;

    const entry: ScheduledAnswer = {
      scheduledQuestionId: currentQ.id,
      questionId: currentQ.question.id,
      answerValue: skipped ? null : finalAnswer,
      answerText: answerText || undefined,
      responseTimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      skipped,
    };

    const updated = [...answers.filter(a => a.scheduledQuestionId !== currentQ.id), entry];
    onAnswersChange(updated);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  // Auto-advance helper for discrete answer types
  const selectAndAdvance = (value: unknown) => {
    setAnswer(value);
    setTimeout(() => saveAndAdvance(false, value), 400);
  };

  if (!currentQ?.question) return null;

  const question = currentQ.question;
  const questionText = isRTL && question.text_ar ? question.text_ar : question.text;

  const renderInput = () => {
    switch (question.type) {
      case 'likert_5':
        return (
          <RadioGroup value={String(answer || '')} onValueChange={v => selectAndAdvance(Number(v))} className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} className="flex flex-col items-center gap-2">
                <RadioGroupItem value={String(v)} id={`sq-likert-${v}`} className="h-9 w-9" />
                <Label htmlFor={`sq-likert-${v}`} className="text-xs text-center text-muted-foreground">
                  {v === 1 ? t('survey.stronglyDisagree') : v === 5 ? t('survey.stronglyAgree') : v}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'numeric_scale':
      case 'scale':
        return (
          <div className="space-y-4 px-2">
            <Slider value={[Number(answer) || 5]} onValueChange={([v]) => setAnswer(v)} min={1} max={10} step={1} className="py-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1</span>
              <span className="text-2xl font-bold text-primary transition-all duration-200">{String(answer ?? 5)}</span>
              <span>10</span>
            </div>
          </div>
        );
      case 'yes_no':
        return (
          <div className="flex gap-4">
            <Button variant={answer === true ? 'default' : 'outline'} className="flex-1 h-14 text-lg rounded-xl" onClick={() => selectAndAdvance(true)}>{t('common.yes')}</Button>
            <Button variant={answer === false ? 'default' : 'outline'} className="flex-1 h-14 text-lg rounded-xl" onClick={() => selectAndAdvance(false)}>{t('common.no')}</Button>
          </div>
        );
      case 'open_ended':
        return <Textarea value={String(answer || '')} onChange={e => setAnswer(e.target.value)} placeholder={t('survey.typeYourAnswer')} className="min-h-[100px]" dir="auto" />;
      case 'multiple_choice':
        if (!question.options || !Array.isArray(question.options)) return null;
        return (
          <RadioGroup onValueChange={v => selectAndAdvance(v)} className="space-y-2">
            {(question.options as string[]).map((opt, i) => {
              const isSelected = answer === String(opt);
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/50'
                }`}>
                  <RadioGroupItem value={String(opt)} id={`sq-mc-${i}`} />
                  <Label htmlFor={`sq-mc-${i}`} className="cursor-pointer flex-1">{String(opt)}</Label>
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-in zoom-in-50 duration-200" />}
                </div>
              );
            })}
          </RadioGroup>
        );
      default:
        return <Textarea value={String(answer || '')} onChange={e => setAnswer(e.target.value)} placeholder={t('survey.typeYourAnswer')} dir="auto" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{t('wellness.scheduledQuestion')}</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{currentIndex + 1} {t('survey.of')} {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card className="border-dashed hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-6 space-y-5">
          {question.category && (
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-xs">
                {isRTL && question.category.name_ar ? question.category.name_ar : question.category.name}
              </Badge>
            </div>
          )}
          <h4 className="text-base font-medium text-center" dir="auto">{questionText}</h4>
          {renderInput()}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {currentIndex === 0 && onBack && (
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => saveAndAdvance(true)} className="text-muted-foreground">
          <SkipForward className="h-4 w-4 me-1" />
          {t('survey.skip')}
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => saveAndAdvance(false)} disabled={answer === null}>
          {currentIndex < questions.length - 1 ? t('common.next') : t('common.done')}
        </Button>
      </div>
    </div>
  );
}
