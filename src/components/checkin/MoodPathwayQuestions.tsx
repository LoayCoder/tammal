import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, CheckCircle2, ChevronDown } from 'lucide-react';
import { useMoodPathwayQuestions } from '@/hooks/useMoodPathwayQuestions';
import { useMoodQuestionConfig } from '@/hooks/useMoodQuestionConfig';
import { Question } from '@/hooks/useQuestions';

export interface PathwayAnswer {
  questionId: string;
  questionTextEn: string;
  selectedOption: string;
  freeText?: string;
  theme: string;
}

interface MoodPathwayQuestionsProps {
  moodLevel: string;
  moodScore: number;
  tenantId: string;
  language: string;
  onAnswersChange: (answers: PathwayAnswer[]) => void;
}

export function MoodPathwayQuestions({
  moodLevel,
  tenantId,
  language,
  onAnswersChange,
}: MoodPathwayQuestionsProps) {
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({});
  const [isSkipped, setIsSkipped] = useState(false);

  const { data: questions = [], isLoading } = useMoodPathwayQuestions(moodLevel, tenantId);
  const { configs } = useMoodQuestionConfig(tenantId);

  // Check if this mood level is enabled
  const config = configs.find(c => c.mood_level === moodLevel);
  const isEnabled = !config || config.is_enabled;
  const enableFreeText = config?.enable_free_text ?? false;
  const isExtremeMood = moodLevel === 'great' || moodLevel === 'need_help';

  // Emit answers upward whenever they change
  useEffect(() => {
    if (isSkipped || questions.length === 0) {
      onAnswersChange([]);
      return;
    }

    const payload: PathwayAnswer[] = questions
      .map((q: Question) => ({
        questionId: q.id,
        questionTextEn: q.text,
        selectedOption: answers[q.id] || '',
        freeText: freeTexts[q.id] || undefined,
        theme: q.category?.name || 'general',
      }))
      .filter(a => a.selectedOption !== '');

    onAnswersChange(payload);
  }, [answers, freeTexts, questions, isSkipped]);

  const handleOptionSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleFreeText = (questionId: string, value: string) => {
    setFreeTexts(prev => ({ ...prev, [questionId]: value }));
  };

  // Hide if disabled or skipped
  if (!isEnabled || isSkipped) return null;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-semibold">{t('moodPathway.loadingQuestions')}</p>
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  // No questions tagged for this mood — hide gracefully
  if (questions.length === 0) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-3.5 w-3.5 text-primary" />
          </div>
          <h4 className="text-sm font-semibold">{t('moodPathway.title')}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground h-7 px-2 gap-1"
          onClick={() => {
            setIsSkipped(true);
            onAnswersChange([]);
          }}
        >
          <ChevronDown className="h-3 w-3" />
          {t('moodPathway.skipQuestions')}
        </Button>
      </div>

      {/* Questions */}
      {questions.map((q: Question) => {
        const questionText = isRTL && q.text_ar ? q.text_ar : q.text;
        const options = (q.options || []) as string[];
        const isAnswered = !!answers[q.id];
        const categoryName = q.category
          ? (isRTL && q.category.name_ar ? q.category.name_ar : q.category.name)
          : null;

        return (
          <div key={q.id} className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
            {/* Category badge */}
            {categoryName && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  {categoryName}
                </Badge>
              </div>
            )}

            {/* Question text */}
            <p className="font-medium text-sm text-center" dir="auto">
              {questionText}
            </p>

            {/* Options — only for multiple_choice */}
            {options.length > 0 ? (
              <RadioGroup
                value={answers[q.id] || ''}
                onValueChange={v => handleOptionSelect(q.id, v)}
                className="space-y-1.5"
              >
                {options.map((opt, i) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-sm cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleOptionSelect(q.id, opt)}
                    >
                      <RadioGroupItem value={opt} id={`pathway-${q.id}-${i}`} />
                      <Label
                        htmlFor={`pathway-${q.id}-${i}`}
                        className="cursor-pointer flex-1 text-sm leading-snug"
                        dir="auto"
                      >
                        {opt}
                      </Label>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            ) : (
              /* Open-ended or other types — text input */
              <Textarea
                value={answers[q.id] || ''}
                onChange={e => handleOptionSelect(q.id, e.target.value)}
                placeholder={t('moodPathway.freeTextPlaceholder')}
                rows={2}
                className="resize-none text-sm rounded-xl"
                dir="auto"
              />
            )}

            {/* Free-text for extreme moods when enabled */}
            {enableFreeText && isExtremeMood && isAnswered && options.length > 0 && (
              <div className="pt-1 space-y-1.5 animate-in fade-in duration-200">
                <p className="text-xs text-muted-foreground text-center">
                  {t('moodPathway.shareMore')}
                </p>
                <Textarea
                  value={freeTexts[q.id] || ''}
                  onChange={e => handleFreeText(q.id, e.target.value)}
                  placeholder={t('moodPathway.freeTextPlaceholder')}
                  rows={2}
                  className="resize-none text-sm rounded-xl"
                  dir="auto"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
