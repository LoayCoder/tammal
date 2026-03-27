import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Settings, CreditCard, History } from 'lucide-react';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';
import { useTenants } from '@/hooks/org/useTenants';
import { useTenantUsage } from '@/hooks/org/useTenantUsage';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { useSubscriptions } from '@/hooks/org/useSubscriptions';
import { UsageStatsCards } from '@/components/tenants/UsageStatsCards';
import { UsageCharts } from '@/components/tenants/UsageCharts';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { TenantStatusBadge } from '@/components/tenants/TenantStatusBadge';
import { format } from 'date-fns';
import { cardVariants, typography} from "@/theme/tokens";
import { PageHeader } from '@/components/system';

export default function TenantDashboard() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { tenants, isPending: isLoadingTenants } = useTenants();
  const { usage, history, isPending: isLoadingUsage, isPendingHistory: isLoadingHistory } = useTenantUsage(id);
  const { logs, isPending: isLoadingLogs } = useAuditLog({ tenantId: id, limit: 10 });
  const { subscriptions, isPending: isLoadingSubscriptions } = useSubscriptions();

  const tenant = tenants.find(t => t.id === id);
  const plan = tenant?.plan || null;
  const tenantSubscription = subscriptions.find(s => s.tenant_id === id);

  if (isLoadingTenants) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground mb-4">{t('tenantDashboard.notFound')}</p>
        <Button onClick={() => navigate('/admin/tenants')}>
          <ArrowLeft className="h-4 w-4 me-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/admin/tenants')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
        title={tenant.name}
        subtitle={tenant.slug ? tenant.slug + (tenant.domain ? ' • ' + tenant.domain : '') : tenant.domain}
        variant="card"
        actions={
          <div className="flex items-center gap-2">
            <TenantStatusBadge status={tenant.status} />
            <Button variant="outline" onClick={() => navigate('/admin/tenants')}>
              <Settings className="h-4 w-4 me-2" />
              {t('tenants.manage')}
            </Button>
          </div>
        }
      />

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={cardVariants.glass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t('tenantDashboard.subscription')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSubscriptions ? (
              <Skeleton className="h-6 w-24" />
            ) : tenantSubscription ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{plan?.name || t('tenants.noPlan')}</Badge>
                  <Badge 
                    variant={tenantSubscription.status === 'active' ? 'default' : 'secondary'}
                  >
                    {t(`common.${tenantSubscription.status}`)}
                  </Badge>
                </div>
                {tenantSubscription.renewal_date && (
                  <p className="text-xs text-muted-foreground">
                    {t('tenantDashboard.renewsOn')}: {format(new Date(tenantSubscription.renewal_date), 'PP')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('tenantDashboard.noSubscription')}</p>
            )}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('tenantDashboard.plan')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plan ? (
              <div className="space-y-1">
                <p className={typography.sectionTitle}>{plan.name}</p>
                <p className={typography.subtitle}>
                  ${Number(plan.price).toFixed(2)} / {plan.billing_period}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t('tenants.noPlan')}</p>
            )}
          </CardContent>
        </Card>

        <Card className={cardVariants.glass}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('tenantDashboard.createdAt')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={typography.sectionTitle}>
              {format(new Date(tenant.created_at), 'PP')}
            </p>
            <p className={typography.subtitle}>
              {format(new Date(tenant.created_at), 'p')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <UsageStatsCards 
        usage={usage} 
        tenant={tenant}
        plan={plan}
        isLoading={isLoadingUsage} 
      />

      {/* Charts */}
      <UsageCharts 
        history={history} 
        isLoading={isLoadingHistory} 
      />

      {/* Recent Activity */}
      <Card className={cardVariants.glass}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t('tenantDashboard.recentActivity')}
            </CardTitle>
            <CardDescription>
              {t('tenantDashboard.recentActivityDescription')}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/audit-logs')}>
            {t('tenantDashboard.viewAll')}
          </Button>
        </CardHeader>
        <CardContent>
          <AuditLogTable logs={logs} isLoading={isLoadingLogs} compact />
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  );
}
