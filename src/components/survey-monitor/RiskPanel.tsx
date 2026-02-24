import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import type { DepartmentStat } from '@/hooks/analytics/useSurveyMonitor';

interface Props {
  departments: DepartmentStat[];
  threshold?: number;
}

export function RiskPanel({ departments, threshold = 50 }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const atRisk = departments.filter(d => d.rate < threshold);

  if (atRisk.length === 0) {
    return (
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-1" />
            {t('surveyMonitor.riskPanel.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('surveyMonitor.riskPanel.noRisk')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0 rounded-xl">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {t('surveyMonitor.riskPanel.title')}
          <Badge variant="destructive" className="ms-2">{atRisk.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {atRisk.map(dept => (
          <div
            key={dept.departmentId}
            className="flex justify-between items-center p-2 rounded-md bg-destructive/10"
          >
            <div className="min-w-0">
              <span className="text-sm font-medium">
                {isAr && dept.departmentNameAr ? dept.departmentNameAr : dept.departmentName}
              </span>
              <span className="text-xs text-muted-foreground ms-2">
                {dept.employeesCompleted}/{dept.totalEmployees}
              </span>
            </div>
            <Badge variant="destructive">{dept.rate}%</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
