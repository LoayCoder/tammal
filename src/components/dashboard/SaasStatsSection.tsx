import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, CreditCard, DollarSign, Ticket } from 'lucide-react';
import { useDashboardStats } from '@/hooks/analytics/useDashboardStats';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DashboardBrandingPreview } from '@/components/branding/DashboardBrandingPreview';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

const GLASS_TOOLTIP_STYLE = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
};

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
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-stat border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {stat.value === null ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-chart border-0">
          <CardHeader><CardTitle>{t('dashboard.subscriptionBreakdown')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px] w-full" /> : subscriptionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={subscriptionChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                    {subscriptionChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={GLASS_TOOLTIP_STYLE} /><Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">{t('common.noData')}</p>}
          </CardContent>
        </Card>
        <Card className="glass-chart border-0">
          <CardHeader><CardTitle>{t('dashboard.tenantBreakdown')}</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[200px] w-full" /> : tenantChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={tenantChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                    {tenantChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={GLASS_TOOLTIP_STYLE} /><Legend />
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
