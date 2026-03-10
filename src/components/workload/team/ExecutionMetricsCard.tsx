import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface ExecutionMetricsCardProps {
  velocity: number;
  completionRate: number;
  overdueRate: number;
}

export function ExecutionMetricsCard({ velocity, completionRate, overdueRate }: ExecutionMetricsCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          {t('teamWorkload.executionMetrics')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-3">
          <div className="text-center space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{velocity}</p>
            <p className="text-xs text-muted-foreground">{t('teamWorkload.teamVelocity')}</p>
          </div>
          <div className="text-center space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{completionRate}%</p>
            <p className="text-xs text-muted-foreground">{t('teamWorkload.completionRate')}</p>
          </div>
          <div className="text-center space-y-1 p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{overdueRate}%</p>
            <p className="text-xs text-muted-foreground">{t('teamWorkload.overdueRate')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
