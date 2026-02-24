import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SaasStatsSection } from './SaasStatsSection';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { Phone, HeartHandshake, ChevronRight } from 'lucide-react';

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

      {/* Quick Actions */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t('dashboard.quickActions')}</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Link to="/crisis-support">
            <Card className="glass-card border-0 ring-1 ring-destructive/20 cursor-pointer transition-all hover:shadow-lg hover:ring-destructive/40">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
                  <Phone className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{t('crisisSupport.nav.crisisSupport')}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{t('dashboard.crisisSupportDesc')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/first-aider">
            <Card className="glass-card border-0 ring-1 ring-chart-1/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-1/40">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-1/10">
                  <HeartHandshake className="h-6 w-6 text-chart-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{t('crisisSupport.nav.firstAider')}</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{t('dashboard.firstAiderDesc')}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      <Card className="glass-chart border-0">
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
