import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { AlertTriangle } from 'lucide-react';

interface MetricItem {
  employee_id: string;
  burnout_risk_score: number;
}

interface TeamMember {
  employeeId: string;
  employeeName: string;
}

interface Props {
  metrics: MetricItem[];
  teamLoad: TeamMember[];
  isPending: boolean;
}

export function BurnoutRiskMapCard({ metrics, teamLoad, isPending }: Props) {
  const { t } = useTranslation();
  const atRisk = metrics.filter(m => m.burnout_risk_score > 30).sort((a, b) => b.burnout_risk_score - a.burnout_risk_score).slice(0, 9);

  return (
    <Card className="glass-card border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {t('executive.burnoutRiskMap')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? <Skeleton className="h-32" /> : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {atRisk.map(m => {
              const emp = teamLoad.find(t => t.employeeId === m.employee_id);
              return (
                <div key={m.employee_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp?.employeeName ?? m.employee_id}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={m.burnout_risk_score} className="h-1.5 flex-1" />
                      <span className="text-xs font-semibold">{Math.round(m.burnout_risk_score)}%</span>
                    </div>
                  </div>
                  <Badge variant={m.burnout_risk_score > 60 ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                    {m.burnout_risk_score > 60 ? t('adminWorkload.highRisk') : t('adminWorkload.mediumRisk')}
                  </Badge>
                </div>
              );
            })}
            {atRisk.length === 0 && (
              <p className="text-muted-foreground text-sm col-span-full text-center py-8">{t('executive.noBurnoutRisks')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
