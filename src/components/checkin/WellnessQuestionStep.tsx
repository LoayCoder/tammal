import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

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
}

export function WellnessQuestionStep({ question, isLoading, answerValue, onAnswerChange }: WellnessQuestionStepProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('wellness.dailyQuestion')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : question ? (
          <div className="space-y-4">
            <p className="font-medium">{question.question_text}</p>
            {question.question_type === 'scale' && (
              <div className="space-y-2">
                <Slider
                  min={1} max={10} step={1}
                  defaultValue={[5]}
                  onValueChange={v => onAnswerChange(v[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span><span>10</span>
                </div>
              </div>
            )}
            {question.question_type === 'multiple_choice' && question.options.length > 0 && (
              <RadioGroup onValueChange={v => onAnswerChange(v)}>
                {question.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`wopt-${i}`} />
                    <Label htmlFor={`wopt-${i}`}>{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {question.question_type === 'text' && (
              <Textarea
                value={typeof answerValue === 'string' ? answerValue : ''}
                onChange={e => onAnswerChange(e.target.value)}
                placeholder={t('wellness.typeAnswer')}
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('wellness.noQuestion')}</p>
        )}
      </CardContent>
    </Card>
  );
}
