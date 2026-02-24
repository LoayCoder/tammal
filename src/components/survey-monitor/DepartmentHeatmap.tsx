import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import type { DepartmentStat } from '@/hooks/analytics/useSurveyMonitor';

interface Props {
  departments: DepartmentStat[];
  isLoading: boolean;
  riskThreshold?: number;
}

export function DepartmentHeatmap({ departments, isLoading, riskThreshold = 50 }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (departments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('common.noData')}
        </CardContent>
      </Card>
    );
  }

  const getColor = (rate: number) => {
    if (rate >= 80) return 'bg-chart-1';
    if (rate >= riskThreshold) return 'bg-chart-4';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('surveyMonitor.departmentHeatmap')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {departments.map(dept => (
          <div key={dept.departmentId} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                {isAr && dept.departmentNameAr ? dept.departmentNameAr : dept.departmentName}
              </span>
              <span className="text-muted-foreground">
                {dept.completed}/{dept.total} ({dept.rate}%)
              </span>
            </div>
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary/30">
              <div
                className={`h-full rounded-full transition-all ${getColor(dept.rate)}`}
                style={{ width: `${dept.rate}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
