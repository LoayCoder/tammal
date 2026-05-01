import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Settings, CreditCard, History, Activity, ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';
import { useTenants } from '@/hooks/org/useTenants';
import { useTenantUsage } from '@/hooks/org/useTenantUsage';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { useSubscriptions } from '@/hooks/org/useSubscriptions';
import { UsageStatsCards } from '@/components/tenants/UsageStatsCards';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { TenantStatusBadge } from '@/components/tenants/TenantStatusBadge';
import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cardVariants, chartSeries, layout, typography} from "@/theme/tokens";
import { PageHeader } from '@/components/system';
import { EmptyAnalyticsState } from '@/features/org-dashboard/components/EmptyAnalyticsState';

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
  const chartData = history.map((item) => ({
    date: format(new Date(item.period_start), 'MMM'),
    activeUsers: item.active_users ?? 0,
    totalUsers: item.total_users ?? 0,
    apiCalls: item.api_calls ?? 0,
    storage: Number(item.storage_used_mb ?? 0) / 1024,
  }));

  const engagementRate = usage && (usage.total_users ?? 0) > 0
    ? Math.round(((usage.active_users ?? 0) / (usage.total_users ?? 1)) * 100)
    : 0;
  const complianceScore = Math.max(65, 100 - logs.filter((log) => log.action === 'delete').length * 8);
  const growthScore = usage?.usersTrend ?? 0;
  const healthScore = tenant?.status === 'active' ? Math.max(72, engagementRate) : 42;

  const topKpis = [
    {
      label: 'Tenant health',
      value: `${healthScore}%`,
      icon: Activity,
      tone: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
      detail: tenant?.status || 'unknown',
    },
    {
      label: 'Growth',
      value: `${growthScore >= 0 ? '+' : ''}${growthScore}%`,
      icon: TrendingUp,
      tone: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]',
      detail: 'Active user momentum',
    },
    {
      label: 'Compliance',
      value: `${complianceScore}%`,
      icon: ShieldCheck,
      tone: 'bg-[var(--chart-3)]/10 text-[var(--chart-3)]',
      detail: `${logs.length} audit signals`,
    },
    {
      label: 'Engagement',
      value: `${engagementRate}%`,
      icon: Users,
      tone: 'bg-[var(--chart-4)]/10 text-[var(--chart-4)]',
      detail: `${usage?.active_users ?? 0} active of ${usage?.total_users ?? 0}`,
    },
  ];

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
        subtitle={tenant.slug ? tenant.slug + (tenant.domain ? ' • ' + tenant.domain : '') : (tenant.domain ?? undefined)}
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topKpis.map((item) => (
          <Card key={item.label} className={cardVariants.elevated}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={typography.statLabel}>{item.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">{item.value}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{item.detail}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <UsageStatsCards 
        usage={usage ? {
          active_users: usage.active_users ?? 0,
          total_users: usage.total_users ?? 0,
          storage_used_mb: usage.storage_used_mb ?? 0,
          api_calls: usage.api_calls ?? 0,
          usersTrend: usage.usersTrend,
          storageTrend: usage.storageTrend,
          apiCallsTrend: usage.apiCallsTrend,
        } : null} 
        tenant={tenant}
        plan={plan}
        isLoading={isLoadingUsage} 
      />

      <div className={layout.dashboardGrid}>
        <div className="space-y-4 xl:col-span-8">
          <Card className={cardVariants.surface}>
            <CardHeader className="p-5 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Tenant performance signal</CardTitle>
                  <CardDescription>Users, API demand, and storage trend over the last 12 periods.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                    {plan?.name || t('tenants.noPlan')}
                  </Badge>
                  {tenantSubscription && (
                    <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                      {t(`common.${tenantSubscription.status}`)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {isLoadingHistory ? (
                <div className="space-y-4">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-[340px] w-full rounded-xl" />
                </div>
              ) : chartData.length === 0 ? (
                <EmptyAnalyticsState icon={Activity} />
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tenantUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartSeries.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={chartSeries.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    />
                    <Area type="monotone" dataKey="activeUsers" name="Active users" fill="url(#tenantUsers)" stroke={chartSeries.primary} strokeWidth={3} />
                    <Line type="monotone" dataKey="apiCalls" name="API calls" stroke={chartSeries.secondary} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="storage" name="Storage (GB)" stroke={chartSeries.tertiary} strokeWidth={2.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className={cardVariants.surface}>
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-medium">{t('tenantDashboard.subscription')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {isLoadingSubscriptions ? (
                  <Skeleton className="h-6 w-24" />
                ) : tenantSubscription ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--chart-2)]" />
                      <span className="font-medium text-[var(--text-primary)]">{plan?.name || t('tenants.noPlan')}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {tenantSubscription.renewal_date ? `${t('tenantDashboard.renewsOn')}: ${format(new Date(tenantSubscription.renewal_date), 'PP')}` : t('tenantDashboard.recentActivityDescription')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">{t('tenantDashboard.noSubscription')}</p>
                )}
              </CardContent>
            </Card>

            <Card className={cardVariants.surface}>
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-medium">{t('tenantDashboard.plan')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                {plan ? (
                  <>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{plan.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      ${Number(plan.price).toFixed(2)} / {plan.billing_period}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">{t('tenants.noPlan')}</p>
                )}
              </CardContent>
            </Card>

            <Card className={cardVariants.surface}>
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-medium">{t('tenantDashboard.createdAt')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{format(new Date(tenant.created_at), 'PP')}</p>
                <p className="mt-1 font-mono text-xs tabular-nums text-[var(--text-muted)]">{format(new Date(tenant.created_at), 'p')}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card className={cardVariants.elevated}>
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  {t('tenantDashboard.recentActivity')}
                </CardTitle>
                <CardDescription>{t('tenantDashboard.recentActivityDescription')}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" onClick={() => navigate('/admin/audit-logs')}>
                {t('tenantDashboard.viewAll')}
              </Button>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <AuditLogTable logs={logs} isLoading={isLoadingLogs} compact />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
