import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, HardDrive, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import type { Tenant } from '@/hooks/org/useTenants';
import type { Plan } from '@/hooks/org/usePlans';
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from '@/lib/utils';

interface UsageStatsCardsProps {
  usage: {
    active_users: number;
    total_users: number;
    storage_used_mb: number | string;
    api_calls: number;
    usersTrend?: number;
    storageTrend?: number;
    apiCallsTrend?: number;
  } | null;
  tenant: Tenant | null;
  plan: Plan | null;
  isLoading: boolean;
}

export function UsageStatsCards({ usage, tenant, plan, isLoading }: UsageStatsCardsProps) {
  const { t } = useTranslation();

  const maxUsers = (tenant?.settings as Record<string, unknown> | null)?.max_users as number ?? plan?.max_users ?? 10;
  const maxStorageMb = (plan?.max_storage_gb ?? 10) * 1024;

  const activeUsers = usage?.active_users ?? 0;
  const totalUsers = usage?.total_users ?? 0;
  const storageUsedMb = Number(usage?.storage_used_mb ?? 0);
  const apiCalls = usage?.api_calls ?? 0;

  const userPercentage = maxUsers > 0 ? Math.min((totalUsers / maxUsers) * 100, 100) : 0;
  const storagePercentage = maxStorageMb > 0 ? Math.min((storageUsedMb / maxStorageMb) * 100, 100) : 0;

  const formatStorageSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const TrendIndicator = ({ value }: { value?: number }) => {
    if (value === undefined) return null;
    const isPositive = value >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-[var(--chart-6)]' : 'text-[var(--chart-5)]';
    
    return (
      <span className={`flex items-center rounded-full border px-2 py-1 text-[11px] ${colorClass} ${isPositive ? 'border-[var(--chart-6)]/20 bg-[var(--chart-6)]/10' : 'border-[var(--chart-5)]/20 bg-[var(--chart-5)]/10'}`}>
        <Icon className="h-3 w-3 me-1" />
        {Math.abs(value)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className={cardVariants.elevated}>
            <CardHeader className="p-5 pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent className="px-5 pb-5 pt-0">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className={cn(cardVariants.elevated, "overflow-hidden")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
          <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
            {t('tenantDashboard.activeUsers')}
          </CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-baseline justify-between">
            <div className={typography.metric}>{activeUsers}</div>
            <TrendIndicator value={usage?.usersTrend} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('tenantDashboard.ofTotal', { count: totalUsers })}
          </p>
        </CardContent>
      </Card>

      <Card className={cn(cardVariants.elevated, "overflow-hidden")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
          <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
            {t('tenantDashboard.userQuota')}
          </CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--chart-2)]/10 text-[var(--chart-2)]">
            <Users className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className={typography.metric}>
            {totalUsers} / {maxUsers === -1 ? '∞' : maxUsers}
          </div>
          {maxUsers !== -1 && (
            <Progress value={userPercentage} className="mt-2" />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {maxUsers === -1 
              ? t('tenantDashboard.unlimited') 
              : `${userPercentage.toFixed(0)}% ${t('tenantDashboard.used')}`}
          </p>
        </CardContent>
      </Card>

      <Card className={cn(cardVariants.elevated, "overflow-hidden")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
          <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
            {t('tenantDashboard.storage')}
          </CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--chart-3)]/10 text-[var(--chart-3)]">
            <HardDrive className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-baseline justify-between">
            <div className={typography.metric}>
              {formatStorageSize(storageUsedMb)}
            </div>
            <TrendIndicator value={usage?.storageTrend} />
          </div>
          <Progress value={storagePercentage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {t('tenantDashboard.of')} {formatStorageSize(maxStorageMb)}
          </p>
        </CardContent>
      </Card>

      <Card className={cn(cardVariants.elevated, "overflow-hidden")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
          <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">
            {t('tenantDashboard.apiCalls')}
          </CardTitle>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--chart-4)]/10 text-[var(--chart-4)]">
            <Activity className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-0">
          <div className="flex items-baseline justify-between">
            <div className={typography.metric}>
              {apiCalls.toLocaleString()}
            </div>
            <TrendIndicator value={usage?.apiCallsTrend} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('tenantDashboard.thisPeriod')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
