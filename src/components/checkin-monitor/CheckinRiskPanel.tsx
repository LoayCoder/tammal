import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, UserX, TrendingDown, Building2 } from 'lucide-react';
import type { RiskAlert } from '@/hooks/analytics/useCheckinMonitor';

interface Props {
  alerts: RiskAlert[];
}

const iconMap = {
  low_mood: TrendingDown,
  disengaged: UserX,
  low_department: Building2,
};

const colorMap = {
  low_mood: 'bg-destructive/10 text-destructive',
  disengaged: 'bg-chart-4/10 text-chart-4',
  low_department: 'bg-destructive/10 text-destructive',
};

export function CheckinRiskPanel({ alerts }: Props) {
  const { t } = useTranslation();

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-1" />
            {t('checkinMonitor.risk.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('checkinMonitor.risk.noRisk')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {t('checkinMonitor.risk.title')}
          <Badge variant="destructive" className="ms-2">{alerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-80 overflow-auto">
        {alerts.map((alert, idx) => {
          const Icon = iconMap[alert.type];
          return (
            <div key={idx} className={`flex items-center justify-between p-2 rounded-md ${colorMap[alert.type]}`}>
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-medium">{alert.label}</span>
                  <span className="text-xs text-muted-foreground ms-2">{alert.detail}</span>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-xs">
                {t(`checkinMonitor.risk.${alert.type}`)}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
