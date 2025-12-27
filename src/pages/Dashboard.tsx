import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, CreditCard, DollarSign, Ticket } from 'lucide-react';
import { DashboardBrandingPreview } from '@/components/branding/DashboardBrandingPreview';

export default function Dashboard() {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.totalTenants'),
      value: '24',
      icon: Building2,
      change: '+12%',
    },
    {
      title: t('dashboard.activeSubscriptions'),
      value: '18',
      icon: CreditCard,
      change: '+8%',
    },
    {
      title: t('dashboard.monthlyRevenue'),
      value: '$12,450',
      icon: DollarSign,
      change: '+23%',
    },
    {
      title: t('dashboard.pendingTickets'),
      value: '7',
      icon: Ticket,
      change: '-5%',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">No recent activity</p>
          </CardContent>
        </Card>
        <DashboardBrandingPreview />
      </div>
    </div>
  );
}
