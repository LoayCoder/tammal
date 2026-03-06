import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  avgAlignment: number;
  avgUtilization: number;
  atRiskCount: number;
  isPending: boolean;
}

export function AlignmentOverviewCard({ avgAlignment, avgUtilization, atRiskCount, isPending }: Props) {
  const { t } = useTranslation();

  const stats = [
    { label: t('executive.overallAlignment'), value: `${avgAlignment}%` },
    { label: t('executive.overallUtilization'), value: `${avgUtilization}%` },
    { label: t('executive.employeesAtRisk'), value: atRiskCount },
  ];

  return (
    <Card className="glass-card border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('executive.organizationAlignment')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-20" /> : (
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map(s => (
              <div key={s.label} className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
