import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, CreditCard, DollarSign, Ticket } from 'lucide-react';
import { MetricCard } from '@/components/system';
import { useDashboardStats } from '@/hooks/analytics/useDashboardStats';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DashboardBrandingPreview } from '@/components/branding/DashboardBrandingPreview';
import { cardVariants, typography } from '@/theme/tokens';
import { CHART_TOOLTIP_STYLE } from '@/config/chart-styles';

const BRAND_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-5))',
];

export function SaasStatsSection() {
  const { t, i18n } = useTranslation();
  const { stats, isPending: isLoading } = useDashboardStats();

  const statCards = [
    { title: t('dashboard.totalTenants'), value: isLoading ? null : stats?.totalTenants ?? 0, icon: Building2 },
    { title: t('dashboard.activeSubscriptions'), value: isLoading ? null : stats?.activeSubscriptions ?? 0, icon: CreditCard },
    { title: t('dashboard.monthlyRevenue'), value: isLoading ? null : formatCurrency(stats?.monthlyRevenue ?? 0, i18n.language), icon: DollarSign },
    { title: t('dashboard.pendingTickets'), value: '—', icon: Ticket },
  ];

  const subscriptionChartData = stats?.subscriptionsByStatus
    ? Object.entries(stats.subscriptionsByStatus).map(([name, value]) => ({ name: t(`common.${name}`) || name, value }))
    : [];

  const tenantChartData = stats?.tenantsByStatus
    ? Object.entries(stats.tenantsByStatus).map(([name, value]) => ({ name: t(`common.${name}`) || name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={typography.pageTitle}>{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <MetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value === null ? <Skeleton className="h-8 w-24" /> : stat.value}
            icon={<stat.icon className="h-4 w-4 text-primary" />}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle>{t('dashboard.subscriptionBreakdown')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px] w-full" /> : subscriptionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={subscriptionChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                    {subscriptionChartData.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">{t('common.noData')}</p>}
          </CardContent>
        </Card>
        <Card className={cardVariants.glass}>
          <CardHeader><CardTitle>{t('dashboard.tenantBreakdown')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px] w-full" /> : tenantChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={tenantChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                    {tenantChartData.map((_, i) => <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">{t('common.noData')}</p>}
          </CardContent>
        </Card>
      </div>

      <DashboardBrandingPreview />
    </div>
  );
}