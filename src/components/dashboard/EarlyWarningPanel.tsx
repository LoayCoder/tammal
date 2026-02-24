import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingDown, Zap, Users, RotateCcw } from 'lucide-react';
import type { EarlyWarning } from '@/lib/wellnessAnalytics';

interface Props {
  warnings: EarlyWarning[];
  isLoading: boolean;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<any>; label: string }> = {
  declining_trend: { icon: TrendingDown, label: 'orgDashboard.warningDeclining' },
  spike_detected: { icon: Zap, label: 'orgDashboard.warningSpike' },
  low_engagement: { icon: Users, label: 'orgDashboard.warningLowEngagement' },
  recurring_risk: { icon: RotateCcw, label: 'orgDashboard.warningRecurring' },
};

export function EarlyWarningPanel({ warnings, isLoading }: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('orgDashboard.earlyWarnings')}
          </CardTitle>
        </CardHeader>
        <CardContent><Skeleton className="h-[200px] w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-chart-4" />
          {t('orgDashboard.earlyWarnings')}
          {warnings.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{warnings.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warnings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">{t('orgDashboard.noAlerts')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map(w => {
              const config = TYPE_CONFIG[w.type] ?? TYPE_CONFIG.declining_trend;
              const Icon = config.icon;

              return (
                <div key={w.id} className="flex items-start gap-3 p-3 rounded-lg glass-badge">
                  <div className={`mt-0.5 p-1.5 rounded ${w.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-chart-4/10 text-chart-4'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant={w.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {t(`orgDashboard.severity.${w.severity}`)}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{t(config.label)}</span>
                    </div>
                    <p className="text-sm">{w.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
