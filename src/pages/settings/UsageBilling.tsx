import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useTenantUsage } from '@/hooks/org/useTenantUsage';
import { useProfile } from '@/hooks/auth/useProfile';
import { useSubscriptions } from '@/hooks/org/useSubscriptions';
import { Users, HardDrive, Activity, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';

export default function UsageBilling() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const tenantId = profile?.tenant_id ?? undefined;

  const { usage, isLoading } = useTenantUsage(tenantId);
  const { subscriptions, isLoading: subLoading } = useSubscriptions();
  const tenantSubscriptions = tenantId ? subscriptions.filter(s => s.tenant_id === tenantId) : [];

  const activeSubscription = tenantSubscriptions.find(s => s.status === 'active' && !s.deleted_at);
  const plan = (activeSubscription as any)?.plans;

  const maxUsers = plan?.max_users ?? null;
  const maxStorageGb = plan?.max_storage_gb ?? null;

  const activeUsers = usage?.active_users ?? 0;
  const storageMb = Number(usage?.storage_used_mb ?? 0);
  const storageGb = storageMb / 1024;

  const userPct = maxUsers ? Math.min(Math.round((activeUsers / maxUsers) * 100), 100) : null;
  const storagePct = maxStorageGb ? Math.min(Math.round((storageGb / maxStorageGb) * 100), 100) : null;

  const TrendBadge = ({ trend }: { trend?: number }) => {
    if (trend === undefined || trend === null) return null;
    return (
      <Badge variant={trend >= 0 ? 'secondary' : 'outline'} className="text-xs gap-1">
        {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(trend)}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><CreditCard className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('billing.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('billing.subtitle', 'Monitor your plan usage and billing information')}</p>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      {!subLoading && activeSubscription && (
        <Card className="glass-stat border-0 rounded-xl overflow-hidden relative group hover:-translate-y-1 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('billing.currentPlan', 'Current Plan')}</CardTitle>
              <Badge variant="default">{activeSubscription.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{plan?.name ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {t('billing.renewsOn', 'Renews')}: {activeSubscription.renewal_date ?? '—'}
                </p>
              </div>
              <p className="text-2xl font-bold">
                {plan?.price != null ? `${plan.price} ${t('billing.currency', 'SAR')}` : '—'}
                <span className="text-sm font-normal text-muted-foreground">/{plan?.billing_period ?? 'mo'}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Quotas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{t('billing.userQuota')}</CardTitle>
              </div>
              <TrendBadge trend={usage?.usersTrend} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-full rounded" />
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{activeUsers} / {maxUsers ?? '∞'} {t('billing.users', 'users')}</span>
                  <span className="text-muted-foreground">{userPct !== null ? `${userPct}%` : '—'}</span>
                </div>
                {userPct !== null && (
                  <Progress value={userPct} className={userPct > 85 ? '[&>div]:bg-destructive' : ''} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">{t('billing.storageQuota')}</CardTitle>
              </div>
              <TrendBadge trend={usage?.storageTrend} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-8 w-full rounded" />
            ) : (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{storageGb.toFixed(2)} GB / {maxStorageGb ?? '∞'} GB</span>
                  <span className="text-muted-foreground">{storagePct !== null ? `${storagePct}%` : '—'}</span>
                </div>
                {storagePct !== null && (
                  <Progress value={storagePct} className={storagePct > 85 ? '[&>div]:bg-destructive' : ''} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Calls */}
      {usage && (
        <Card className="glass-stat border-0 rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">{t('billing.apiCalls', 'API Calls This Period')}</CardTitle>
              <TrendBadge trend={usage?.apiCallsTrend} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{usage.api_calls?.toLocaleString() ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('billing.period', 'Period')}: {usage.period_start} → {usage.period_end}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Placeholder */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle>{t('billing.invoices')}</CardTitle>
          <CardDescription>{t('billing.invoicesDesc', 'Your billing history will appear here once invoices are generated.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
