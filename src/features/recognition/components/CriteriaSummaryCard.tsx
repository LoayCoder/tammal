import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Scale } from 'lucide-react';

interface StagedWeight {
  criterion_name: string;
  criterion_name_ar?: string | null;
  original: number;
  nomination?: number;
  manager?: number;
  votingAvg?: number;
}

interface CriteriaSummaryCardProps {
  stages: StagedWeight[];
}

export function CriteriaSummaryCard({ stages }: CriteriaSummaryCardProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Scale className="h-4 w-4" />
          {t('recognition.criteriaEval.fairnessSummary')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-start p-2 font-medium">{t('recognition.criteria.name')}</th>
                <th className="text-center p-2 font-medium">{t('recognition.criteriaEval.original')}</th>
                <th className="text-center p-2 font-medium">{t('recognition.criteriaEval.nomination')}</th>
                <th className="text-center p-2 font-medium">{t('recognition.criteriaEval.manager')}</th>
                <th className="text-center p-2 font-medium">{t('recognition.criteriaEval.votingAvg')}</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="p-2 font-medium">
                    {isAr && s.criterion_name_ar ? s.criterion_name_ar : s.criterion_name}
                  </td>
                  <td className="p-2 text-center">
                    <Badge variant="outline">{s.original}%</Badge>
                  </td>
                  <td className="p-2 text-center">
                    {s.nomination != null ? <Badge variant="secondary">{s.nomination}%</Badge> : '—'}
                  </td>
                  <td className="p-2 text-center">
                    {s.manager != null ? <Badge variant="secondary">{s.manager}%</Badge> : '—'}
                  </td>
                  <td className="p-2 text-center">
                    {s.votingAvg != null ? <Badge variant="secondary">{s.votingAvg}%</Badge> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
