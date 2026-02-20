import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgWellnessStats } from '@/hooks/useOrgWellnessStats';
import { Users, Heart, TrendingUp, Activity } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const MOOD_COLORS: Record<string, string> = {
  great: 'hsl(var(--chart-1))',
  good: 'hsl(var(--chart-2))',
  okay: 'hsl(var(--chart-4))',
  struggling: 'hsl(var(--destructive))',
  need_help: 'hsl(var(--destructive))',
};

export function OrgDashboard() {
  const { t } = useTranslation();
  const { stats, isLoading } = useOrgWellnessStats();

  const statCards = [
    {
      title: t('orgDashboard.activeEmployees'),
      value: stats?.activeEmployees ?? 0,
      icon: Users,
    },
    {
      title: t('orgDashboard.teamWellness'),
      value: stats?.avgMoodScore ? `${stats.avgMoodScore}/5` : '—',
      icon: Heart,
    },
    {
      title: t('orgDashboard.participation'),
      value: stats?.participationRate !== undefined ? `${stats.participationRate}%` : '—',
      icon: TrendingUp,
    },
    {
      title: t('orgDashboard.checkins7d'),
      value: stats?.recentTrend.reduce((s, d) => s + d.count, 0) ?? 0,
      icon: Activity,
    },
  ];

  const trendData = (stats?.recentTrend ?? []).map(d => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM'),
  }));

  const distributionData = (stats?.moodDistribution ?? []).map(d => ({
    name: t(`orgDashboard.moods.${d.level}`, d.level),
    value: d.count,
    fill: MOOD_COLORS[d.level] ?? 'hsl(var(--muted))',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('orgDashboard.title')}</h1>
        <p className="text-muted-foreground">{t('orgDashboard.subtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('orgDashboard.engagementTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="orgMoodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#orgMoodGradient)" dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('orgDashboard.moodDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
