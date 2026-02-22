import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCrisisAnalytics } from '@/hooks/useCrisisAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Clock, AlertTriangle, CheckCircle, TrendingUp, Users } from 'lucide-react';

const RISK_COLORS: Record<string, string> = {
  high: 'hsl(var(--destructive))',
  moderate: 'hsl(var(--chart-4))',
  low: 'hsl(var(--chart-2))',
};

const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--muted-foreground))',
];

export default function CrisisAnalyticsTab({ tenantId }: { tenantId?: string }) {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = useCrisisAnalytics(tenantId);

  if (isLoading || !analytics) {
    return <p className="text-muted-foreground py-8 text-center">{t('common.loading')}</p>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard icon={Activity} label={t('crisisSupport.analytics.totalCases')} value={analytics.totalCases} />
        <KPICard icon={Clock} label={t('crisisSupport.analytics.activeCases')} value={analytics.activeCases} />
        <KPICard icon={CheckCircle} label={t('crisisSupport.analytics.resolvedCases')} value={analytics.resolvedCases} />
        <KPICard icon={AlertTriangle} label={t('crisisSupport.analytics.escalatedCases')} value={analytics.escalatedCases} variant="destructive" />
        <KPICard icon={TrendingUp} label={t('crisisSupport.analytics.avgResponse')} value={analytics.avgFirstResponseMinutes != null ? `${analytics.avgFirstResponseMinutes}m` : '—'} />
        <KPICard icon={Clock} label={t('crisisSupport.analytics.avgResolution')} value={analytics.avgResolutionHours != null ? `${analytics.avgResolutionHours}h` : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cases Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('crisisSupport.analytics.monthlyCases')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.monthlyCases}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('crisisSupport.analytics.riskDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.riskDistribution.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={analytics.riskDistribution} dataKey="count" nameKey="risk" cx="50%" cy="50%" outerRadius={80} label>
                    {analytics.riskDistribution.map((entry, i) => (
                      <Cell key={entry.risk} fill={RISK_COLORS[entry.risk] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Intent Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('crisisSupport.analytics.intentDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.intentDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis dataKey="intent" type="category" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* First Aider Load */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('crisisSupport.analytics.firstAiderLoad')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.firstAiderLoad.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('common.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.firstAiderLoad}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="hsl(var(--chart-1))" name={t('crisisSupport.analytics.activeCases')} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" fill="hsl(var(--chart-2))" name={t('crisisSupport.analytics.resolvedCases')} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, variant }: { icon: any; label: string; value: string | number; variant?: 'destructive' }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className={`h-4 w-4 ${variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
          <span className="text-xs text-muted-foreground truncate">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${variant === 'destructive' ? 'text-destructive' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
