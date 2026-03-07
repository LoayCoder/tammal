import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface CriteriaWeightSliderProps {
  criterionName: string;
  criterionDescription?: string | null;
  originalWeight: number; // percentage 0-100
  adjustedWeight: number; // percentage 0-100
  adjustmentLimit: number; // e.g. 30 means ±30%
  onChange: (newWeight: number) => void;
  disabled?: boolean;
}

export function CriteriaWeightSlider({
  criterionName,
  criterionDescription,
  originalWeight,
  adjustedWeight,
  adjustmentLimit,
  onChange,
  disabled,
}: CriteriaWeightSliderProps) {
  const { t } = useTranslation();

  const minWeight = Math.max(1, Math.round(originalWeight * (1 - adjustmentLimit / 100)));
  const maxWeight = Math.min(100, Math.round(originalWeight * (1 + adjustmentLimit / 100)));

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">{criterionName}</Label>
          {criterionDescription && (
            <p className="text-xs text-muted-foreground mt-0.5">{criterionDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {t('recognition.criteriaEval.original')}: {originalWeight}%
          </Badge>
          <Badge variant="secondary" className="text-xs font-semibold">
            {adjustedWeight}%
          </Badge>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{minWeight}%</span>
          <span>{maxWeight}%</span>
        </div>
        <Slider
          value={[adjustedWeight]}
          onValueChange={([v]) => onChange(v)}
          min={minWeight}
          max={maxWeight}
          step={1}
          disabled={disabled}
          className="w-full"
        />
      </div>
    </div>
  );
}
