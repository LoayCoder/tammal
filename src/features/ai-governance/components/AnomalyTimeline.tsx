import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useAutonomousAuditLog } from '@/hooks/ai-governance/useAutonomousState';

export function AnomalyTimeline() {
  const { t } = useTranslation();
  const { data: logs = [], isPending } = useAutonomousAuditLog(30);

  const anomalyLogs = logs.filter((l: any) => l.anomaly_detected);

  if (isPending) return <Card><CardContent className="p-6 text-muted-foreground">{t('common.loading')}</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {t('aiGovernance.autonomous.anomalyTimeline')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {anomalyLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('aiGovernance.autonomous.noAnomalies')}</p>
        ) : (
          <div className="space-y-3">
            {anomalyLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 border-s-2 border-destructive ps-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="destructive">{t('aiGovernance.autonomous.anomaly')}</Badge>
                    <span className="text-sm font-medium">{log.feature}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{log.adjustment_reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
