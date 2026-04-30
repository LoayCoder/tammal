import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Plus, Minus, Calculator } from 'lucide-react';

interface QuestionCountComplexityProps {
  selectedPeriod: any;
  questionCount: number;
  questionsPerDay: number;
  purpose: string;
  complexity: string;
  onQuestionCountChange: (v: number) => void;
  onQuestionsPerDayChange: (v: number) => void;
  onComplexityChange: (v: string) => void;
  periodDays: number;
  autoQuestionCount: number;
}

export function QuestionCountComplexity({
  selectedPeriod,
  questionCount,
  questionsPerDay,
  purpose,
  complexity,
  onQuestionCountChange,
  onQuestionsPerDayChange,
  onComplexityChange,
  periodDays,
  autoQuestionCount,
}: QuestionCountComplexityProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Question Count — auto-calc when period selected */}
      {selectedPeriod ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t('aiGenerator.questionsPerDay')}
            </Label>
            <p className="text-xs text-muted-foreground">{t('aiGenerator.questionsPerDayDesc')}</p>
            <ToggleGroup
              type="single"
              value={String(questionsPerDay)}
              onValueChange={(v) => { if (v) onQuestionsPerDayChange(Number(v)); }}
              className="justify-start"
            >
              {[1, 2, 3].map(n => (
                <ToggleGroupItem key={n} value={String(n)} className="px-4">
                  {n}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <p className="font-medium">{t('aiGenerator.questionCount')}: {autoQuestionCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('aiGenerator.totalQuestionsCalc', { days: periodDays, perDay: questionsPerDay, total: autoQuestionCount })}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('aiGenerator.questionCount')}</Label>
            {purpose === 'survey' ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={questionCount <= 1}
                  onClick={() => onQuestionCountChange(Math.max(1, questionCount - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={questionCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) onQuestionCountChange(Math.min(200, Math.max(1, val)));
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 1) onQuestionCountChange(1);
                  }}
                  className="h-9 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  disabled={questionCount >= 200}
                  onClick={() => onQuestionCountChange(Math.min(200, questionCount + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Select value={String(questionCount)} onValueChange={v => onQuestionCountChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t('aiGenerator.complexity')}</Label>
            <Select value={complexity} onValueChange={onComplexityChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">{t('aiGenerator.simple')}</SelectItem>
                <SelectItem value="moderate">{t('aiGenerator.moderate')}</SelectItem>
                <SelectItem value="advanced">{t('aiGenerator.advanced')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Complexity - always shown once when period selected */}
      {selectedPeriod && (
        <div className="space-y-2">
          <Label>{t('aiGenerator.complexity')}</Label>
          <Select value={complexity} onValueChange={onComplexityChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">{t('aiGenerator.simple')}</SelectItem>
              <SelectItem value="moderate">{t('aiGenerator.moderate')}</SelectItem>
              <SelectItem value="advanced">{t('aiGenerator.advanced')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}