import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CreditCard, DollarSign, Ticket } from 'lucide-react';
import { DashboardBrandingPreview } from '@/components/branding/DashboardBrandingPreview';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function Dashboard() {
  const { t } = useTranslation();
  const { stats, isLoading } = useDashboardStats();
  const { logs, isLoading: isLoadingLogs } = useAuditLog({ limit: 5 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const statCards = [
    {
      title: t('dashboard.totalTenants'),
      value: isLoading ? null : stats?.totalTenants ?? 0,
      icon: Building2,
    },
    {
      title: t('dashboard.activeSubscriptions'),
      value: isLoading ? null : stats?.activeSubscriptions ?? 0,
      icon: CreditCard,
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: isLoading ? null : formatCurrency(stats?.monthlyRevenue ?? 0),
      icon: DollarSign,
    },
    {
      title: t('dashboard.pendingTickets'),
      value: '—',
      icon: Ticket,
    },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

  const subscriptionChartData = stats?.subscriptionsByStatus
    ? Object.entries(stats.subscriptionsByStatus).map(([name, value]) => ({
        name: t(`common.${name}`) || name,
        value,
      }))
    : [];

  const tenantChartData = stats?.tenantsByStatus
    ? Object.entries(stats.tenantsByStatus).map(([name, value]) => ({
        name: t(`common.${name}`) || name,
        value,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.subscriptionBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : subscriptionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={subscriptionChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subscriptionChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.tenantBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : tenantChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={tenantChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tenantChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogTable logs={logs} isLoading={isLoadingLogs} compact />
          </CardContent>
        </Card>
        <DashboardBrandingPreview />
      </div>
    </div>
  );
}
