import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SaasStatsSection } from './SaasStatsSection';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { useAuditLog } from '@/hooks/useAuditLog';

interface DashboardOverviewTabProps {
  isSuperAdmin: boolean;
}

export function DashboardOverviewTab({ isSuperAdmin }: DashboardOverviewTabProps) {
  const { t } = useTranslation();
  const { logs, isLoading: logsLoading } = useAuditLog({ limit: 5 });

  return (
    <div className="space-y-6">
      {isSuperAdmin && <SaasStatsSection />}

      {!isSuperAdmin && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} isLoading={logsLoading} compact />
        </CardContent>
      </Card>
    </div>
  );
}
