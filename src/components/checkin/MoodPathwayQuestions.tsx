import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Brain, CheckCircle2, ChevronDown } from 'lucide-react';
import { useMoodPathwayQuestions } from '@/hooks/wellness/useMoodPathwayQuestions';
import { useMoodQuestionConfig } from '@/hooks/wellness/useMoodQuestionConfig';
import { Question } from '@/hooks/questions/useQuestions';

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

// Likert-5 labels
const LIKERT_LABELS_EN = ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'];
const LIKERT_LABELS_AR = ['أرفض بشدة', 'أرفض', 'محايد', 'أوافق', 'أوافق بشدة'];

/** Resolve bilingual option to display string */
function resolveOption(opt: string | { text: string; text_ar?: string }, isRTL: boolean): string {
  if (typeof opt === 'string') return opt;
  return isRTL && opt.text_ar ? opt.text_ar : opt.text;
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

  const { configs, isPending: configsLoading } = useMoodQuestionConfig(tenantId);
  const config = configs.find(c => c.mood_level === moodLevel);
  const maxQuestions = configsLoading ? 0 : (config?.max_questions ?? 2);
  const { data: questions = [], isLoading } = useMoodPathwayQuestions(moodLevel, tenantId, maxQuestions);

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

  const selectAndAdvance = (questionId: string, value: string) => {
    handleOptionSelect(questionId, value);
  };

  const handleFreeText = (questionId: string, value: string) => {
    setFreeTexts(prev => ({ ...prev, [questionId]: value }));
  };

  // Render the correct input based on question type
  const renderPathwayInput = (q: Question) => {
    const currentAnswer = answers[q.id] || '';
    const rawOptions = (q.options || []) as Array<string | { text: string; text_ar?: string }>;
    const resolvedOptions = rawOptions.map(opt => resolveOption(opt, isRTL));

    switch (q.type) {
      case 'numeric_scale':
        return (
          <div className="space-y-3 px-2">
            <Slider
              min={1}
              max={10}
              step={1}
              value={[Number(currentAnswer) || 5]}
              onValueChange={v => handleOptionSelect(q.id, String(v[0]))}
              onValueCommit={v => selectAndAdvance(q.id, String(v[0]))}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span className="text-lg font-bold text-primary transition-all duration-200">
                {currentAnswer || '5'}
              </span>
              <span>10</span>
            </div>
          </div>
        );

      case 'yes_no': {
        const yesLabel = resolvedOptions[0] || (isRTL ? 'نعم' : 'Yes');
        const noLabel = resolvedOptions[1] || (isRTL ? 'لا' : 'No');
        return (
          <div className="flex gap-3">
            {[yesLabel, noLabel].map((label, i) => {
              const isSelected = currentAnswer === label;
              return (
                <Button
                  key={i}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  className="flex-1 gap-1.5"
                  onClick={() => selectAndAdvance(q.id, label)}
                >
                  {label}
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                </Button>
              );
            })}
          </div>
        );
      }

      case 'likert_5': {
        const labels = isRTL ? LIKERT_LABELS_AR : LIKERT_LABELS_EN;
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={v => selectAndAdvance(q.id, v)}
            className="space-y-1.5"
          >
            {labels.map((label, i) => {
              const val = String(i + 1);
              const isSelected = currentAnswer === val;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-sm cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => selectAndAdvance(q.id, val)}
                >
                  <RadioGroupItem value={val} id={`pathway-likert-${q.id}-${i}`} />
                  <Label
                    htmlFor={`pathway-likert-${q.id}-${i}`}
                    className="cursor-pointer flex-1 text-sm leading-snug"
                    dir="auto"
                  >
                    {label}
                  </Label>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
              );
            })}
          </RadioGroup>
        );
      }

      case 'multiple_choice': {
        if (resolvedOptions.length === 0) {
          // Fallback to textarea if no options defined
          return (
            <Textarea
              value={currentAnswer}
              onChange={e => handleOptionSelect(q.id, e.target.value)}
              placeholder={t('moodPathway.freeTextPlaceholder')}
              rows={2}
              className="resize-none text-sm rounded-xl"
              dir="auto"
            />
          );
        }
        return (
          <RadioGroup
            value={currentAnswer}
            onValueChange={v => selectAndAdvance(q.id, v)}
            className="space-y-1.5"
          >
            {resolvedOptions.map((opt, i) => {
              const isSelected = currentAnswer === opt;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-sm cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => selectAndAdvance(q.id, opt)}
                >
                  <RadioGroupItem value={opt} id={`pathway-${q.id}-${i}`} />
                  <Label
                    htmlFor={`pathway-${q.id}-${i}`}
                    className="cursor-pointer flex-1 text-sm leading-snug"
                    dir="auto"
                  >
                    {opt}
                  </Label>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
              );
            })}
          </RadioGroup>
        );
      }

      // open_ended or any other type
      default:
        return (
          <Textarea
            value={currentAnswer}
            onChange={e => handleOptionSelect(q.id, e.target.value)}
            placeholder={t('moodPathway.freeTextPlaceholder')}
            rows={2}
            className="resize-none text-sm rounded-xl"
            dir="auto"
          />
        );
    }
  };

  if (!isEnabled || isSkipped) return null;

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
        const isAnswered = !!answers[q.id];
        const categoryName = q.category
          ? (isRTL && q.category.name_ar ? q.category.name_ar : q.category.name)
          : null;

        return (
          <div key={q.id} className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
            <p className="font-medium text-sm text-center" dir="auto">
              {questionText}
            </p>

            {/* Type-aware input */}
            {renderPathwayInput(q)}

            {/* Free-text for extreme moods when enabled */}
            {enableFreeText && isExtremeMood && isAnswered && q.type !== 'open_ended' && (
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
