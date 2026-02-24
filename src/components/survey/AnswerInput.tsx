import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface AnswerInputProps {
  question: {
    id: string;
    type: string;
    options?: unknown[];
    text?: string;
    text_ar?: string;
  } | null;
  answer: unknown;
  onAnswer: (val: unknown) => void;
  disabled?: boolean;
  isRTL?: boolean;
  resolveOption: (opt: unknown) => string;
}

export function AnswerInput({ question, answer, onAnswer, disabled = false, isRTL = false, resolveOption }: AnswerInputProps) {
  const { t } = useTranslation();

  if (!question) return null;

  switch (question.type) {
    case 'likert_5':
      return (
        <RadioGroup
          value={String(answer || '')}
          onValueChange={(v) => onAnswer(Number(v))}
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
            onValueChange={([v]) => onAnswer(v)}
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
            onClick={() => onAnswer(true)}
            disabled={disabled}
          >
            {t('common.yes')}
          </Button>
          <Button
            variant={answer === false ? 'default' : 'outline'}
            className="flex-1 h-12"
            onClick={() => onAnswer(false)}
            disabled={disabled}
          >
            {t('common.no')}
          </Button>
        </div>
      );

    case 'multiple_choice':
      if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
        return (
          <Textarea
            value={String(answer || '')}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={t('survey.typeYourAnswer')}
            className="min-h-[100px]"
            dir="auto"
            disabled={disabled}
          />
        );
      }
      return (
        <RadioGroup
          value={String(answer || '')}
          onValueChange={(v) => onAnswer(v)}
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
          onChange={(e) => onAnswer(e.target.value)}
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
