import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckCircle2, Loader2, Save, Send, Clock, AlertCircle, Lock, PartyPopper, Sparkles } from 'lucide-react';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useScheduledQuestions, useAnsweredSurveyCheck } from '@/hooks/useScheduledQuestions';
import { useEmployeeResponses, useDraftResponses } from '@/hooks/useEmployeeResponses';
import { useProfile } from '@/hooks/useProfile';
import { AnswerInput } from '@/components/survey/AnswerInput';

export default function EmployeeSurvey() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { employee, isLoading: loadingEmployee } = useCurrentEmployee();
  const { profile } = useProfile();
  const { pendingQuestions, surveyMeta, isLoading: loadingQuestions } = useScheduledQuestions(employee?.id);
  const { hasAnswered, isLoading: loadingAnswered } = useAnsweredSurveyCheck(employee?.id);
  const { saveDraft, submitSurvey } = useEmployeeResponses(employee?.id);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Draft responses for pre-population
  const { data: draftResponses = [], isLoading: loadingDrafts } = useDraftResponses(employee?.id, surveyMeta?.schedule_id);

  // Answers map: scheduledQuestionId -> answerValue
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [surveySessionId, setSurveySessionId] = useState<string>(() => crypto.randomUUID());

  // BUG-11 (documented): Draft pre-population intentionally uses { ...drafts, ...prev }
  // so that user-typed answers (already in `prev`) take priority over late-arriving drafts.
  // This is the correct merge order: if a user starts typing before drafts load, their
  // in-progress answers are preserved. The dependency array only includes draftResponses,
  // so this effect only fires when drafts load/change, not on every keystroke.
  useEffect(() => {
    if (draftResponses.length > 0) {
      const drafts: Record<string, unknown> = {};
      for (const d of draftResponses) {
        if (d.scheduled_question_id) {
          drafts[d.scheduled_question_id] = d.answer_value;
        }
      }
      setAnswers(prev => ({ ...drafts, ...prev }));
      // Reuse existing survey_session_id from drafts if available
      const existingSessionId = draftResponses.find(d => d.survey_session_id)?.survey_session_id;
      if (existingSessionId) {
        setSurveySessionId(existingSessionId);
      }
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

    setShowSuccessDialog(true);
  };

  const resolveOption = (opt: unknown): string => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt === 'object' && 'text' in opt) {
      const o = opt as { text: string; text_ar?: string };
      return isRTL && o.text_ar ? o.text_ar : o.text;
    }
    return String(opt);
  };

  if (loadingEmployee || loadingQuestions || loadingDrafts || loadingAnswered) {
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
        <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          {hasAnswered ? t('survey.surveyCompleted', 'Survey Completed') : t('survey.allCaughtUp')}
        </h2>
        <p className="text-muted-foreground">
          {hasAnswered ? t('survey.alreadySubmitted', 'You have already submitted this survey.') : t('survey.noMoreQuestions')}
        </p>
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
          <Card className="glass-card border-0 rounded-xl">
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

          const isPending = question?.validation_status === 'pending';

          return (
            <Card key={sq.id} className={`glass-card border-0 rounded-xl overflow-hidden ${isPending ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {t('survey.question')} {index + 1}
                    </span>
                    {isPending && (
                      <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                        {t('survey.pendingReview', 'Pending Review')}
                      </Badge>
                    )}
                  </div>
                  {question?.category && (
                    <Badge style={{ backgroundColor: question.category.color }}>
                      {isRTL && question.category.name_ar ? question.category.name_ar : question.category.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg" dir="auto">{questionText}</CardTitle>
              </CardHeader>
              <CardContent>
                <AnswerInput question={question} answer={currentAnswer} onAnswer={(val) => setAnswer(sq.id, val)} disabled={isClosed} isRTL={isRTL} resolveOption={resolveOption} />
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
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <PartyPopper className="h-6 w-6 text-primary absolute -top-1 -end-1 animate-bounce" />
              <Sparkles className="h-5 w-5 text-primary absolute -bottom-1 -start-1 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold">
              {t('survey.thankYouTitle', 'Thank You, {{name}}!', { name: profile?.full_name || employee?.full_name || '' })}
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
              {t('survey.thankYouMessage', 'Your responses have been submitted successfully. Your voice matters and helps us build a better workplace for everyone.')}
            </p>

            <div className="bg-muted/50 rounded-lg p-4 w-full">
              <p className="text-sm font-medium flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('survey.motivationMessage', 'Every survey response brings us one step closer to positive change!')}
              </p>
            </div>

            <Button onClick={() => setShowSuccessDialog(false)} className="mt-2 w-full">
              {t('common.done', 'Done')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

