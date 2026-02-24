import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Save, Send, Clock, AlertCircle, Lock } from 'lucide-react';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useScheduledQuestions } from '@/hooks/useScheduledQuestions';
import { useEmployeeResponses, useDraftResponses } from '@/hooks/useEmployeeResponses';

export default function EmployeeSurvey() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { employee, isLoading: loadingEmployee } = useCurrentEmployee();
  const { pendingQuestions, surveyMeta, isLoading: loadingQuestions } = useScheduledQuestions(employee?.id);
  const { saveDraft, submitSurvey } = useEmployeeResponses(employee?.id);

  // Draft responses for pre-population
  const { data: draftResponses = [], isLoading: loadingDrafts } = useDraftResponses(employee?.id, surveyMeta?.schedule_id);

  // Answers map: scheduledQuestionId -> answerValue
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [surveySessionId] = useState(() => crypto.randomUUID());

  // Pre-populate from drafts
  useEffect(() => {
    if (draftResponses.length > 0) {
      const drafts: Record<string, unknown> = {};
      for (const d of draftResponses) {
        if (d.scheduled_question_id) {
          drafts[d.scheduled_question_id] = d.answer_value;
        }
      }
      setAnswers(prev => ({ ...drafts, ...prev }));
    }
  }, [draftResponses]);

  // Time window status
  const timeWindowStatus = useMemo(() => {
    if (!surveyMeta) return 'open';
    const now = new Date();
    if (surveyMeta.start_date && now < new Date(surveyMeta.start_date)) return 'not_started';
    if (surveyMeta.end_date && now > new Date(surveyMeta.end_date)) return 'closed';
    return 'open';
  }, [surveyMeta]);

  const isClosed = timeWindowStatus === 'closed';
  const isNotStarted = timeWindowStatus === 'not_started';

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== undefined && answers[k] !== '').length;
  const totalQuestions = pendingQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const setAnswer = useCallback((sqId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [sqId]: value }));
  }, []);

  const handleSaveDraft = async () => {
    const responsesToSave = Object.entries(answers)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([sqId, val]) => ({
        scheduledQuestionId: sqId,
        answerValue: val,
      }));

    if (responsesToSave.length === 0) return;

    await saveDraft.mutateAsync({
      bulk: true,
      isDraft: true,
      surveySessionId,
      responses: responsesToSave,
      deviceType: 'web',
    });
  };

  const handleSubmitSurvey = async () => {
    if (!allAnswered) return;

    const responsesToSubmit = Object.entries(answers).map(([sqId, val]) => ({
      scheduledQuestionId: sqId,
      answerValue: val,
    }));

    await submitSurvey.mutateAsync({
      bulk: true,
      isDraft: false,
      surveySessionId,
      responses: responsesToSubmit,
      deviceType: 'web',
    });
  };

  const resolveOption = (opt: unknown): string => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt === 'object' && 'text' in opt) {
      const o = opt as { text: string; text_ar?: string };
      return isRTL && o.text_ar ? o.text_ar : o.text;
    }
    return String(opt);
  };

  if (loadingEmployee || loadingQuestions || loadingDrafts) {
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

  if (pendingQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('survey.allCaughtUp')}</h2>
        <p className="text-muted-foreground">{t('survey.noMoreQuestions')}</p>
      </div>
    );
  }

  if (isNotStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Clock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('survey.notStarted', 'Survey Not Yet Open')}</h2>
        <p className="text-muted-foreground">
          {t('survey.opensAt', 'Opens at')}: {surveyMeta?.start_date ? new Date(surveyMeta.start_date).toLocaleString() : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Survey Header */}
      <div className="space-y-3">
        {surveyMeta && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-xl font-bold">{surveyMeta.schedule_name}</h1>
                {isClosed ? (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {t('survey.closed', 'Survey Closed')}
                  </Badge>
                ) : surveyMeta.end_date ? (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('survey.deadline', 'Deadline')}: {new Date(surveyMeta.end_date).toLocaleString()}
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{answeredCount} / {totalQuestions} {t('survey.answered', 'answered')}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {isClosed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('survey.closedMessage', 'This survey is closed. You can no longer edit or submit your responses.')}
          </AlertDescription>
        </Alert>
      )}

      {/* All Questions */}
      <div className="space-y-4">
        {pendingQuestions.map((sq, index) => {
          const question = sq.question;
          const questionText = isRTL && question?.text_ar ? question.text_ar : question?.text;
          const currentAnswer = answers[sq.id];

          return (
            <Card key={sq.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t('survey.question')} {index + 1}
                  </span>
                  {question?.category && (
                    <Badge style={{ backgroundColor: question.category.color }}>
                      {isRTL && question.category.name_ar ? question.category.name_ar : question.category.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg" dir="auto">{questionText}</CardTitle>
              </CardHeader>
              <CardContent>
                {renderAnswerInput(question, currentAnswer, (val) => setAnswer(sq.id, val), isClosed, isRTL, t, resolveOption)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!isClosed && (
        <div className="flex gap-4 pb-8 sticky bottom-4">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saveDraft.isPending || answeredCount === 0}
          >
            {saveDraft.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
            {t('survey.saveDraft', 'Save as Draft')}
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmitSurvey}
            disabled={!allAnswered || submitSurvey.isPending}
          >
            {submitSurvey.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Send className="h-4 w-4 me-2" />}
            {t('survey.submitSurvey', 'Submit Survey')}
          </Button>
        </div>
      )}
    </div>
  );
}

function renderAnswerInput(
  question: any,
  answer: unknown,
  setAnswer: (val: unknown) => void,
  disabled: boolean,
  isRTL: boolean,
  t: any,
  resolveOption: (opt: unknown) => string
) {
  if (!question) return null;

  switch (question.type) {
    case 'likert_5':
      return (
        <RadioGroup
          value={String(answer || '')}
          onValueChange={(v) => setAnswer(Number(v))}
          className="flex justify-between gap-2"
          disabled={disabled}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <div key={value} className="flex flex-col items-center gap-2">
              <RadioGroupItem value={String(value)} id={`likert-${question.id}-${value}`} className="h-8 w-8" />
              <Label htmlFor={`likert-${question.id}-${value}`} className="text-xs text-center">
                {value === 1 ? t('survey.stronglyDisagree') :
                 value === 5 ? t('survey.stronglyAgree') : value}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );

    case 'numeric_scale':
    case 'scale':
      return (
        <div className="space-y-4">
          <Slider
            value={[Number(answer) || 5]}
            onValueChange={([v]) => setAnswer(v)}
            min={1}
            max={10}
            step={1}
            className="py-4"
            disabled={disabled}
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
            className="flex-1 h-12"
            onClick={() => setAnswer(true)}
            disabled={disabled}
          >
            {t('common.yes')}
          </Button>
          <Button
            variant={answer === false ? 'default' : 'outline'}
            className="flex-1 h-12"
            onClick={() => setAnswer(false)}
            disabled={disabled}
          >
            {t('common.no')}
          </Button>
        </div>
      );

    case 'multiple_choice':
      if (!question.options || !Array.isArray(question.options)) return null;
      return (
        <RadioGroup
          value={String(answer || '')}
          onValueChange={(v) => setAnswer(v)}
          className="space-y-2"
          disabled={disabled}
        >
          {(question.options as unknown[]).map((opt, i) => {
            const label = resolveOption(opt);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-all">
                <RadioGroupItem value={label} id={`mc-${question.id}-${i}`} />
                <Label htmlFor={`mc-${question.id}-${i}`} className="cursor-pointer flex-1">{label}</Label>
              </div>
            );
          })}
        </RadioGroup>
      );

    case 'open_ended':
    case 'text':
      return (
        <Textarea
          value={String(answer || '')}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder={t('survey.typeYourAnswer')}
          className="min-h-[100px]"
          dir="auto"
          disabled={disabled}
        />
      );

    default:
      return null;
  }
}
