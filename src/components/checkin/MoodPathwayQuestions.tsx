import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, ChevronDown } from 'lucide-react';

export interface PathwayAnswer {
  questionTextEn: string;
  selectedOption: string;
  freeText?: string;
  theme: string;
}

interface MoodPathwayQuestion {
  question_text_en: string;
  question_text_ar: string;
  options_en: string[];
  options_ar: string[];
  question_type: string;
  theme: string;
  enable_free_text: boolean;
}

interface MoodPathwayQuestionsProps {
  moodLevel: string;
  moodScore: number;
  tenantId: string;
  userId: string;
  language: string;
  onAnswersChange: (answers: PathwayAnswer[]) => void;
}

const THEME_LABELS: Record<string, { en: string; ar: string }> = {
  positive_drivers: { en: 'Positive Energy', ar: 'الطاقة الإيجابية' },
  recognition: { en: 'Recognition', ar: 'التقدير' },
  team_connection: { en: 'Team Connection', ar: 'التواصل مع الفريق' },
  energy_source: { en: 'Energy Source', ar: 'مصدر الطاقة' },
  purpose_alignment: { en: 'Purpose', ar: 'الهدف' },
  momentum_building: { en: 'Momentum', ar: 'الزخم' },
  engagement: { en: 'Engagement', ar: 'الانخراط' },
  collaboration: { en: 'Collaboration', ar: 'التعاون' },
  satisfaction: { en: 'Satisfaction', ar: 'الرضا' },
  progress: { en: 'Progress', ar: 'التقدم' },
  growth: { en: 'Growth', ar: 'النمو' },
  energy_level: { en: 'Energy Level', ar: 'مستوى الطاقة' },
  minor_friction: { en: 'Minor Friction', ar: 'احتكاك طفيف' },
  workload_balance: { en: 'Workload Balance', ar: 'توازن عبء العمل' },
  focus_clarity: { en: 'Focus', ar: 'التركيز' },
  emotional_energy: { en: 'Emotional Energy', ar: 'الطاقة العاطفية' },
  support_access: { en: 'Support Access', ar: 'الوصول للدعم' },
  stressors: { en: 'Stressors', ar: 'مسببات التوتر' },
  burnout_signals: { en: 'Burnout Signals', ar: 'إشارات الإرهاق' },
  work_life_spillover: { en: 'Work-Life Balance', ar: 'التوازن بين العمل والحياة' },
  communication_gaps: { en: 'Communication', ar: 'التواصل' },
  support_needs: { en: 'Support Needs', ar: 'احتياجات الدعم' },
  work_pressure: { en: 'Work Pressure', ar: 'ضغط العمل' },
  immediate_stress_source: { en: 'Stress Source', ar: 'مصدر التوتر' },
  support_preference: { en: 'Support Preference', ar: 'تفضيل الدعم' },
  human_connection: { en: 'Human Connection', ar: 'التواصل الإنساني' },
  safety_support: { en: 'Support', ar: 'الدعم' },
};

export function MoodPathwayQuestions({
  moodLevel,
  moodScore,
  tenantId,
  userId,
  language,
  onAnswersChange,
}: MoodPathwayQuestionsProps) {
  const { t } = useTranslation();
  const isRTL = language === 'ar';

  const [questions, setQuestions] = useState<MoodPathwayQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [freeTexts, setFreeTexts] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSkipped, setIsSkipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchQuestions() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fnError } = await supabase.functions.invoke(
          'generate-mood-questions',
          {
            body: {
              moodLevel,
              moodScore,
              language,
              tenantId,
              userId,
            },
          }
        );

        if (fnError) throw fnError;

        if (data?.disabled || !data?.questions?.length) {
          setIsSkipped(true);
          return;
        }

        setQuestions(data.questions);
      } catch (err: any) {
        console.warn('Mood pathway questions failed:', err);
        // Graceful degradation — hide the component, don't block check-in
        setError(err.message || 'generation_failed');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestions();
  }, [moodLevel, moodScore, language, tenantId, userId]);

  // Emit answers upward whenever they change
  useEffect(() => {
    if (isSkipped || questions.length === 0) {
      onAnswersChange([]);
      return;
    }

    const payload: PathwayAnswer[] = questions
      .map((q, idx) => ({
        questionTextEn: q.question_text_en,
        selectedOption: answers[idx] || '',
        freeText: freeTexts[idx] || undefined,
        theme: q.theme,
      }))
      .filter(a => a.selectedOption !== '');

    onAnswersChange(payload);
  }, [answers, freeTexts, questions, isSkipped]);

  const handleOptionSelect = (qIdx: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const handleFreeText = (qIdx: number, value: string) => {
    setFreeTexts(prev => ({ ...prev, [qIdx]: value }));
  };

  // ── Graceful degradation: hide on error or skip ─────────────────────────────
  if (error || isSkipped) return null;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t('moodPathway.generating')}</p>
            <p className="text-xs text-muted-foreground">{t('moodPathway.generatingSubtext')}</p>
          </div>
        </div>
        <Skeleton className="h-28 w-full rounded-xl" />
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
      {questions.map((q, qIdx) => {
        const questionText = isRTL ? q.question_text_ar : q.question_text_en;
        const options = isRTL ? q.options_ar : q.options_en;
        const isAnswered = !!answers[qIdx];
        const themeLabel = THEME_LABELS[q.theme];
        const themeName = themeLabel
          ? (isRTL ? themeLabel.ar : themeLabel.en)
          : q.theme.replace(/_/g, ' ');

        return (
          <div
            key={qIdx}
            className="rounded-xl border bg-card p-3 sm:p-4 space-y-3"
          >
            {/* Theme badge */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                {themeName}
              </Badge>
            </div>

            {/* Question text */}
            <p className="font-medium text-sm text-center" dir="auto">
              {questionText}
            </p>

            {/* Options */}
            <RadioGroup
              value={answers[qIdx] || ''}
              onValueChange={v => handleOptionSelect(qIdx, v)}
              className="space-y-1.5"
            >
              {options?.map((opt, i) => {
                const isSelected = answers[qIdx] === opt;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-sm cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleOptionSelect(qIdx, opt)}
                  >
                    <RadioGroupItem value={opt} id={`pathway-${qIdx}-${i}`} />
                    <Label
                      htmlFor={`pathway-${qIdx}-${i}`}
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

            {/* Free-text for extreme moods when enabled */}
            {q.enable_free_text && isAnswered && (
              <div className="pt-1 space-y-1.5 animate-in fade-in duration-200">
                <p className="text-xs text-muted-foreground text-center">
                  {t('moodPathway.shareMore')}
                </p>
                <Textarea
                  value={freeTexts[qIdx] || ''}
                  onChange={e => handleFreeText(qIdx, e.target.value)}
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
