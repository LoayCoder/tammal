import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface RiskMember {
  employeeId: string;
  employeeName: string;
  estimatedMinutes: number;
  overdueTasks: number;
}

interface RiskAlertsCardProps {
  members: RiskMember[];
}

export function RiskAlertsCard({ members }: RiskAlertsCardProps) {
  const { t } = useTranslation();

  if (members.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          {t('teamWorkload.riskAlerts')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.slice(0, 5).map(m => (
          <div key={m.employeeId} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
            <div>
              <p className="font-medium text-sm">{m.employeeName}</p>
              <p className="text-xs text-muted-foreground">
                {m.estimatedMinutes > 480 && `${Math.round(m.estimatedMinutes / 60)}h ${t('teamWorkload.scheduled')}`}
                {m.overdueTasks > 0 && ` · ${m.overdueTasks} ${t('common.overdue')}`}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">{t('teamWorkload.atRiskMembers')}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
