import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageCircle, CheckCircle2 } from 'lucide-react';

interface WellnessQuestion {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
}

interface WellnessQuestionStepProps {
  question: WellnessQuestion | null;
  isLoading: boolean;
  answerValue: unknown;
  onAnswerChange: (value: unknown) => void;
  onAutoAdvance?: () => void;
}

export function WellnessQuestionStep({ question, isLoading, answerValue, onAnswerChange, onAutoAdvance }: WellnessQuestionStepProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const resolveOption = (opt: unknown): string => {
    if (typeof opt === 'string') return opt;
    if (opt && typeof opt === 'object' && 'text' in opt) {
      const o = opt as { text: string; text_ar?: string };
      return isRTL && o.text_ar ? o.text_ar : o.text;
    }
    return String(opt);
  };

  const selectAndAdvance = (val: unknown) => {
    onAnswerChange(val);
    if (onAutoAdvance) onAutoAdvance();
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-2">
          <MessageCircle className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{t('wellness.dailyQuestion')}</h3>
      </div>

      <Card className="border-dashed hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : question ? (
            <div className="space-y-5">
              <p className="font-medium text-center text-base" dir="auto">{question.question_text}</p>
              {(question.question_type === 'scale' || question.question_type === 'numeric_scale') && (
                <div className="space-y-3 px-2">
                  <Slider
                    min={1} max={10} step={1}
                    value={[Number(answerValue) || 5]}
                    onValueChange={v => onAnswerChange(v[0])}
                    onValueCommit={v => selectAndAdvance(v[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="text-lg font-bold text-primary transition-all duration-200">{String(answerValue ?? 5)}</span>
                    <span>10</span>
                  </div>
                </div>
              )}
              {question.question_type === 'multiple_choice' && question.options.length > 0 && (
                <RadioGroup onValueChange={v => selectAndAdvance(v)} className="space-y-2">
                  {question.options.map((opt, i) => {
                    const label = resolveOption(opt);
                    const isSelected = answerValue === label;
                    return (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
                        isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'hover:bg-muted/50'
                      }`}>
                        <RadioGroupItem value={label} id={`wopt-${i}`} />
                        <Label htmlFor={`wopt-${i}`} className="cursor-pointer flex-1">{label}</Label>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0 animate-in zoom-in-50 duration-200" />}
                      </div>
                    );
                  })}
                </RadioGroup>
              )}
              {question.question_type === 'text' && (
                <Textarea
                  value={typeof answerValue === 'string' ? answerValue : ''}
                  onChange={e => onAnswerChange(e.target.value)}
                  onBlur={() => { if (answerValue && onAutoAdvance) onAutoAdvance(); }}
                  placeholder={t('wellness.typeAnswer')}
                  className="min-h-[100px]"
                />
              )}
              {question.question_type === 'yes_no' && (
                <div className="flex gap-3">
                  <Button
                    variant={answerValue === true ? 'default' : 'outline'}
                    className="flex-1 h-12 text-base rounded-xl"
                    onClick={() => selectAndAdvance(true)}
                  >
                    {t('common.yes')}
                  </Button>
                  <Button
                    variant={answerValue === false ? 'default' : 'outline'}
                    className="flex-1 h-12 text-base rounded-xl"
                    onClick={() => selectAndAdvance(false)}
                  >
                    {t('common.no')}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <span className="text-4xl">📋</span>
              <p className="text-sm text-muted-foreground">{t('wellness.noQuestion')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
