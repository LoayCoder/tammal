import { useTranslation } from 'react-i18next';
import { Label } from '@/shared/components/ui/label';
import { Slider } from '@/shared/components/ui/slider';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export interface CriterionEvaluation {
  criterion_id: string;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  weight: number; // 0-100
  justification: string;
}

interface CriteriaEvaluationFormProps {
  criteria: CriterionEvaluation[];
  onChange: (criteria: CriterionEvaluation[]) => void;
  readOnly?: boolean;
}

export function CriteriaEvaluationForm({ criteria, onChange, readOnly }: CriteriaEvaluationFormProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValid = Math.abs(totalWeight - 100) < 0.5;

  const updateCriterion = (index: number, updates: Partial<CriterionEvaluation>) => {
    const updated = criteria.map((c, i) => (i === index ? { ...c, ...updates } : c));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Weight total indicator */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{t('recognition.criteriaEval.weightDistribution')}</Label>
        <Badge variant={isValid ? 'default' : 'destructive'}>
          {t('recognition.criteria.totalWeight')}: {totalWeight}%
        </Badge>
      </div>

      {!isValid && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {t('recognition.criteriaEval.mustEqual100')}
          </AlertDescription>
        </Alert>
      )}

      {criteria.map((criterion, idx) => {
        const name = isAr && criterion.name_ar ? criterion.name_ar : criterion.name;
        return (
          <div key={criterion.criterion_id} className="space-y-2 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">{name}</Label>
                {criterion.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{criterion.description}</p>
                )}
              </div>
              <Badge variant="secondary" className="text-xs font-semibold">
                {criterion.weight}%
              </Badge>
            </div>

            {!readOnly && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>5%</span>
                  <span>100%</span>
                </div>
                <Slider
                  value={[criterion.weight]}
                  onValueChange={([v]) => updateCriterion(idx, { weight: v })}
                  min={5}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">{t('recognition.criteriaEval.justification')}</Label>
              <Textarea
                value={criterion.justification}
                onChange={(e) => updateCriterion(idx, { justification: e.target.value })}
                placeholder={t('recognition.criteriaEval.justificationPlaceholder')}
                rows={2}
                className="text-sm"
                readOnly={readOnly}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Check if all weights sum to 100 */
export function isCriteriaWeightValid(criteria: CriterionEvaluation[]): boolean {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);
  return Math.abs(total - 100) < 0.5;
}
