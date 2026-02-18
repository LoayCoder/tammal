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
import { CheckCircle2, SkipForward, Loader2 } from 'lucide-react';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useScheduledQuestions } from '@/hooks/useScheduledQuestions';
import { useEmployeeResponses } from '@/hooks/useEmployeeResponses';

export default function EmployeeSurvey() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  
  const { employee, isLoading: loadingEmployee } = useCurrentEmployee();
  const { pendingQuestions, isLoading: loadingQuestions, skipQuestion } = useScheduledQuestions(employee?.id);
  const { submitResponse } = useEmployeeResponses(employee?.id);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState<unknown>(null);
  const [answerText, setAnswerText] = useState('');
  const [startTime, setStartTime] = useState<number>(Date.now());

  const currentQuestion = pendingQuestions[currentIndex];
  const progress = pendingQuestions.length > 0 
    ? ((currentIndex) / pendingQuestions.length) * 100 
    : 0;

  useEffect(() => {
    setStartTime(Date.now());
    setAnswer(null);
    setAnswerText('');
  }, [currentIndex]);

  const handleSubmit = async () => {
    if (!currentQuestion || answer === null) return;
    
    const responseTime = Math.floor((Date.now() - startTime) / 1000);
    
    await submitResponse.mutateAsync({
      scheduledQuestionId: currentQuestion.id,
      answerValue: answer,
      answerText: answerText || undefined,
      responseTimeSeconds: responseTime,
      deviceType: 'web',
    });
    
    if (currentIndex < pendingQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    skipQuestion.mutate(currentQuestion.id);
    if (currentIndex < pendingQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (loadingEmployee || loadingQuestions) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-2">{t('survey.noProfile')}</h2>
        <p className="text-muted-foreground">{t('survey.contactAdmin')}</p>
      </div>
    );
  }

  if (pendingQuestions.length === 0 || currentIndex >= pendingQuestions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('survey.allCaughtUp')}</h2>
        <p className="text-muted-foreground">{t('survey.noMoreQuestions')}</p>
      </div>
    );
  }

  const question = currentQuestion.question;
  const questionText = isRTL && question?.text_ar ? question.text_ar : question?.text;

  const renderAnswerInput = () => {
    if (!question) return null;

    switch (question.type) {
      case 'likert_5':
        return (
          <RadioGroup
            value={String(answer || '')}
            onValueChange={(v) => setAnswer(Number(v))}
            className="flex justify-between gap-2"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="flex flex-col items-center gap-2">
                <RadioGroupItem value={String(value)} id={`likert-${value}`} className="h-8 w-8" />
                <Label htmlFor={`likert-${value}`} className="text-xs text-center">
                  {value === 1 ? t('survey.stronglyDisagree') : 
                   value === 5 ? t('survey.stronglyAgree') : value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'numeric_scale':
        return (
          <div className="space-y-4">
            <Slider
              value={[Number(answer) || 5]}
              onValueChange={([v]) => setAnswer(v)}
              min={1}
              max={10}
              step={1}
              className="py-4"
            />
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
            <Button
              variant={answer === true ? 'default' : 'outline'}
              className="flex-1 h-16 text-lg"
              onClick={() => setAnswer(true)}
            >
              {t('common.yes')}
            </Button>
            <Button
              variant={answer === false ? 'default' : 'outline'}
              className="flex-1 h-16 text-lg"
              onClick={() => setAnswer(false)}
            >
              {t('common.no')}
            </Button>
          </div>
        );

      case 'open_ended':
        return (
          <Textarea
            value={String(answer || '')}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('survey.typeYourAnswer')}
            className="min-h-[150px]"
            dir="auto"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{t('survey.question')} {currentIndex + 1} {t('survey.of')} {pendingQuestions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {question?.category && (
            <Badge 
              className="mb-4"
              style={{ backgroundColor: question.category.color }}
            >
              {isRTL && question.category.name_ar ? question.category.name_ar : question.category.name}
            </Badge>
          )}
          
          <h2 className="text-2xl font-semibold mb-8" dir="auto">
            {questionText}
          </h2>

          <div className="space-y-6">
            {renderAnswerInput()}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={skipQuestion.isPending}
        >
          <SkipForward className="h-4 w-4 me-2" />
          {t('survey.skip')}
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={answer === null || submitResponse.isPending}
        >
          {submitResponse.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin me-2" />
          ) : null}
          {currentIndex < pendingQuestions.length - 1 
            ? t('survey.nextQuestion')
            : t('survey.finish')
          }
        </Button>
      </div>
    </div>
  );
}