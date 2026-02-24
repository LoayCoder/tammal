import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, AlertTriangle, TrendingDown, BarChart } from 'lucide-react';
import type { SurveyStructuralMetrics } from '@/lib/synthesisEngine';

interface Props {
  data: SurveyStructuralMetrics | null;
  isLoading: boolean;
}

export function SurveyStructuralCard({ data, isLoading }: Props) {
  const { t } = useTranslation();

  const metrics = [
    {
      label: t('synthesis.categoryHealth'),
      value: data?.categoryHealthScore ? `${data.categoryHealthScore}/5` : '—',
      icon: BarChart,
    },
    {
      label: t('synthesis.lowestCategory'),
      value: data?.lowestCategory ? `${data.lowestCategory.name} (${data.lowestCategory.score})` : '—',
      icon: TrendingDown,
    },
    {
      label: t('synthesis.surveyQuality'),
      value: data ? `${data.participationQuality}%` : '—',
      icon: ClipboardCheck,
    },
    {
      label: t('synthesis.riskCategories'),
      value: data?.riskCategoryCount?.toString() ?? '—',
      icon: AlertTriangle,
      highlight: (data?.riskCategoryCount ?? 0) > 0,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          {t('synthesis.surveyStructural')}
        </CardTitle>
        <p className="text-xs text-muted-foreground">{t('synthesis.surveyStructuralDesc')}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <p className="text-xs text-muted-foreground truncate">{m.label}</p>
            {isLoading ? (
              <Skeleton className="h-6 w-16" />
            ) : (
              <div className="flex items-center gap-1.5">
                <m.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-lg font-semibold truncate">{m.value}</span>
                {m.highlight && <Badge variant="destructive" className="text-[10px] px-1 py-0">{data?.riskCategoryCount}</Badge>}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
