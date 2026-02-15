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
import { SkipForward } from 'lucide-react';
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
}

export function ScheduledQuestionsStep({ questions, answers, onAnswersChange, onComplete }: ScheduledQuestionsStepProps) {
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

  const saveAndAdvance = (skipped: boolean) => {
    if (!currentQ?.question) return;

    const entry: ScheduledAnswer = {
      scheduledQuestionId: currentQ.id,
      questionId: currentQ.question.id,
      answerValue: skipped ? null : answer,
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

  if (!currentQ?.question) return null;

  const question = currentQ.question;
  const questionText = isRTL && question.text_ar ? question.text_ar : question.text;

  const renderInput = () => {
    switch (question.type) {
      case 'likert_5':
        return (
          <RadioGroup value={String(answer || '')} onValueChange={v => setAnswer(Number(v))} className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} className="flex flex-col items-center gap-2">
                <RadioGroupItem value={String(v)} id={`sq-likert-${v}`} className="h-8 w-8" />
                <Label htmlFor={`sq-likert-${v}`} className="text-xs text-center">
                  {v === 1 ? t('survey.stronglyDisagree') : v === 5 ? t('survey.stronglyAgree') : v}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'numeric_scale':
        return (
          <div className="space-y-4">
            <Slider value={[Number(answer) || 5]} onValueChange={([v]) => setAnswer(v)} min={1} max={10} step={1} className="py-4" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>1</span>
              <span className="text-2xl font-bold text-primary">{String(answer ?? 5)}</span>
              <span>10</span>
            </div>
          </div>
        );
      case 'yes_no':
        return (
          <div className="flex gap-4">
            <Button variant={answer === true ? 'default' : 'outline'} className="flex-1 h-16 text-lg" onClick={() => setAnswer(true)}>{t('common.yes')}</Button>
            <Button variant={answer === false ? 'default' : 'outline'} className="flex-1 h-16 text-lg" onClick={() => setAnswer(false)}>{t('common.no')}</Button>
          </div>
        );
      case 'open_ended':
        return <Textarea value={String(answer || '')} onChange={e => setAnswer(e.target.value)} placeholder={t('survey.typeYourAnswer')} className="min-h-[120px]" dir="auto" />;
      case 'multiple_choice':
        if (!question.options || !Array.isArray(question.options)) return null;
        return (
          <RadioGroup onValueChange={v => setAnswer(v)}>
            {(question.options as string[]).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <RadioGroupItem value={String(opt)} id={`sq-mc-${i}`} />
                <Label htmlFor={`sq-mc-${i}`}>{String(opt)}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      default:
        return <Textarea value={String(answer || '')} onChange={e => setAnswer(e.target.value)} placeholder={t('survey.typeYourAnswer')} dir="auto" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('wellness.scheduledQuestion')} {currentIndex + 1} {t('survey.of')} {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardContent className="p-6">
          {question.category && (
            <Badge className="mb-3" style={{ backgroundColor: question.category.color }}>
              {isRTL && question.category.name_ar ? question.category.name_ar : question.category.name}
            </Badge>
          )}
          <h3 className="text-lg font-semibold mb-6" dir="auto">{questionText}</h3>
          {renderInput()}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => saveAndAdvance(true)}>
          <SkipForward className="h-4 w-4 me-2" />
          {t('survey.skip')}
        </Button>
        <Button className="flex-1" onClick={() => saveAndAdvance(false)} disabled={answer === null}>
          {currentIndex < questions.length - 1 ? t('common.next') : t('common.done')}
        </Button>
      </div>
    </div>
  );
}
