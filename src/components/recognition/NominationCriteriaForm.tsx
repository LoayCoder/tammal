import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CriteriaEvaluationForm, isCriteriaWeightValid, type CriterionEvaluation } from './CriteriaEvaluationForm';
import { useJudgingCriteria } from '@/hooks/recognition/useJudgingCriteria';
import { Scale, ChevronLeft, ChevronRight } from 'lucide-react';

interface NominationCriteriaFormProps {
  themeId: string;
  onSubmit: (evaluations: CriterionEvaluation[]) => void;
  onBack: () => void;
  isPending?: boolean;
}

export function NominationCriteriaForm({ themeId, onSubmit, onBack, isPending }: NominationCriteriaFormProps) {
  const { t } = useTranslation();
  const { criteria: judgingCriteria, isPending: criteriaLoading } = useJudgingCriteria(themeId);
  const [evaluations, setEvaluations] = useState<CriterionEvaluation[]>([]);

  // Initialize evaluations from judging criteria
  useEffect(() => {
    if (judgingCriteria.length > 0 && evaluations.length === 0) {
      setEvaluations(
        judgingCriteria.map(c => ({
          criterion_id: c.id,
          name: c.name,
          name_ar: c.name_ar,
          description: c.description,
          weight: Math.round(Number(c.weight) * 100), // convert decimal to percentage
          justification: '',
        }))
      );
    }
  }, [judgingCriteria, evaluations.length]);

  const isValid = isCriteriaWeightValid(evaluations) && evaluations.every(e => e.justification.trim().length > 0);

  if (criteriaLoading) {
    return <div className="text-sm text-muted-foreground">{t('common.loading')}</div>;
  }

  if (judgingCriteria.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('recognition.criteriaEval.noCriteria')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="h-5 w-5" />
          {t('recognition.criteriaEval.title')}
        </CardTitle>
        <CardDescription>{t('recognition.criteriaEval.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CriteriaEvaluationForm criteria={evaluations} onChange={setEvaluations} />

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 me-1 rtl:rotate-180" />
            {t('common.back')}
          </Button>
          <Button onClick={() => onSubmit(evaluations)} disabled={!isValid || isPending}>
            {t('common.next')}
            <ChevronRight className="h-4 w-4 ms-1 rtl:rotate-180" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
