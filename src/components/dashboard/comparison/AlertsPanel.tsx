import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import type { DivergenceAlert } from '@/lib/synthesisEngine';

interface Props {
  alerts: DivergenceAlert[];
  isLoading: boolean;
}

const SEVERITY_ICONS = {
  high: ShieldAlert,
  medium: AlertTriangle,
  low: Info,
};

const SEVERITY_STYLES = {
  high: 'border-destructive/30 bg-destructive/5',
  medium: 'border-yellow-500/30 bg-yellow-500/5',
  low: 'border-muted bg-muted/5',
};

export function AlertsPanel({ alerts, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          {t('synthesis.alertsTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6">
            <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('synthesis.noAlerts')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => {
              const Icon = SEVERITY_ICONS[alert.severity];
              return (
                <div key={i} className={`rounded-lg border p-4 ${SEVERITY_STYLES[alert.severity]}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{t(alert.patternKey)}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {t('synthesis.confidenceLabel')}: {alert.confidence}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{t(alert.descriptionKey)}</p>
                      <p className="text-xs font-medium text-primary">{t(alert.interventionKey)}</p>
                    </div>
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
