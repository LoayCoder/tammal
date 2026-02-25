import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface CriterionScorerProps {
  criterion: {
    id: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    weight: number;
    scoring_guide: Record<string, any>;
  };
  score: number;
  justification: string;
  onScoreChange: (score: number) => void;
  onJustificationChange: (text: string) => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export function CriterionScorer({
  criterion,
  score,
  justification,
  onScoreChange,
  onJustificationChange,
}: CriterionScorerProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const name = isAr && criterion.name_ar ? criterion.name_ar : criterion.name;
  const needsJustification = score === 1 || score === 5;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">{name}</Label>
          {criterion.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {t('recognition.criteria.weight')}: {criterion.weight}%
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span className="font-medium text-foreground text-sm">
            {score} — {SCORE_LABELS[score] || ''}
          </span>
          <span>5</span>
        </div>
        <Slider
          value={[score]}
          onValueChange={([v]) => onScoreChange(v)}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
      </div>

      {needsJustification && (
        <div className="space-y-1">
          <Label className="text-xs text-destructive">
            {t('recognition.voting.extremeScoreRequired')}
          </Label>
          <Textarea
            value={justification}
            onChange={(e) => onJustificationChange(e.target.value)}
            placeholder={t('recognition.voting.justificationPlaceholder')}
            className="text-sm min-h-[60px]"
          />
          <p className="text-xs text-muted-foreground">
            {justification.length}/50 {t('recognition.voting.charsMin')}
          </p>
        </div>
      )}
    </div>
  );
}
