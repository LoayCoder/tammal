import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkloadAnalytics, type TeamMemberLoad } from '@/hooks/workload/useWorkloadAnalytics';
import {
  Users, AlertTriangle, Clock, Target, TrendingUp, Moon,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
};

function getLoadColor(mins: number) {
  if (mins > 480) return 'hsl(var(--destructive))';
  if (mins > 360) return 'hsl(var(--chart-4))';
  return 'hsl(var(--chart-1))';
}

export default function WorkloadDashboard() {
  const { t } = useTranslation();
  const {
    teamLoad, objProgress, isLoading,
    totalEmployees, avgLoadMinutes, atRiskCount, offHoursWorkers,
  } = useWorkloadAnalytics();

  const statCards = [
    { title: t('adminWorkload.totalEmployees'), value: totalEmployees, icon: Users },
    { title: t('adminWorkload.avgLoad'), value: `${Math.round(avgLoadMinutes / 60)}h`, icon: Clock },
    { title: t('adminWorkload.atRisk'), value: atRiskCount, icon: AlertTriangle },
    { title: t('adminWorkload.offHoursWorkers'), value: offHoursWorkers, icon: Moon },
  ];

  const topLoaded = [...teamLoad].sort((a, b) => b.estimatedMinutes - a.estimatedMinutes).slice(0, 10);
  const chartData = topLoaded.map(t => ({
    name: t.employeeName.split(' ').slice(0, 2).join(' '),
    hours: Math.round(t.estimatedMinutes / 60 * 10) / 10,
    minutes: t.estimatedMinutes,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('adminWorkload.pageTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('adminWorkload.pageDesc')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {statCards.map(stat => (
          <Card key={stat.title} className="glass-stat border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium truncate">{stat.title}</CardTitle>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <stat.icon className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="capacity" className="space-y-4">
        <TabsList className="glass-tabs border-0 h-auto">
          <TabsTrigger value="capacity" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">
            {t('adminWorkload.tabs.capacity')}
          </TabsTrigger>
          <TabsTrigger value="objectives" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">
            {t('adminWorkload.tabs.objectives')}
          </TabsTrigger>
          <TabsTrigger value="offHours" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">
            {t('adminWorkload.tabs.offHours')}
          </TabsTrigger>
        </TabsList>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-4">
          <Card className="glass-chart border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('adminWorkload.topLoadedEmployees')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-[280px] w-full" /> : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={GLASS_TOOLTIP} formatter={(v: number) => [`${v}h`, t('adminWorkload.hours')]} />
                    <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={getLoadColor(entry.minutes)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Team Table */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('adminWorkload.teamOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-40" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.employee')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.activeTasks')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.load')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('commandCenter.overdue')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.offHours')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamLoad.map(m => (
                        <tr key={m.employeeId} className="border-b border-border/10">
                          <td className="py-2.5 font-medium">{m.employeeName}</td>
                          <td className="py-2.5">{m.activeTasks}</td>
                          <td className="py-2.5">{Math.round(m.estimatedMinutes / 60 * 10) / 10}h</td>
                          <td className="py-2.5">
                            {m.overdueTasks > 0 ? (
                              <Badge variant="destructive" className="text-xs">{m.overdueTasks}</Badge>
                            ) : '—'}
                          </td>
                          <td className="py-2.5">{m.offHoursMinutes > 0 ? `${Math.round(m.offHoursMinutes / 60)}h` : '—'}</td>
                          <td className="py-2.5">
                            <Badge variant={m.estimatedMinutes > 480 ? 'destructive' : m.estimatedMinutes > 360 ? 'secondary' : 'default'} className="text-xs">
                              {m.estimatedMinutes > 480 ? t('adminWorkload.overloaded') : m.estimatedMinutes > 360 ? t('commandCenter.busy') : t('commandCenter.healthy')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {teamLoad.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">{t('common.noData')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-4">
          {isLoading ? <Skeleton className="h-40" /> : objProgress.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {objProgress.map(obj => (
                <Card key={obj.id} className="glass-card border-0">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{obj.title}</h3>
                        <p className="text-xs text-muted-foreground">{obj.quarter} {obj.year}</p>
                      </div>
                      <Badge variant={obj.status === 'on_track' ? 'default' : obj.status === 'delayed' ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                        {t(`workload.status.${obj.status === 'on_track' ? 'onTrack' : obj.status === 'at_risk' ? 'atRisk' : obj.status}`)}
                      </Badge>
                    </div>
                    <Progress value={obj.progress} className="h-2" />
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{obj.initiativeCount} {t('workload.initiatives.sectionTitle')}</span>
                      <span>{obj.completedActions}/{obj.actionCount} {t('workload.actions.sectionTitle')}</span>
                      <span className="ms-auto font-semibold text-foreground">{obj.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-0">
              <CardContent className="p-10 text-center text-muted-foreground">{t('workload.objectives.empty')}</CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Off-Hours Tab */}
        <TabsContent value="offHours" className="space-y-4">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('adminWorkload.offHoursAnalysis')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-40" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.employee')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.sessions')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.totalOffHours')}</th>
                        <th className="text-start py-2 font-medium text-muted-foreground">{t('adminWorkload.riskLevel')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamLoad.filter(m => m.offHoursMinutes > 0).sort((a, b) => b.offHoursMinutes - a.offHoursMinutes).map(m => (
                        <tr key={m.employeeId} className="border-b border-border/10">
                          <td className="py-2.5 font-medium">{m.employeeName}</td>
                          <td className="py-2.5">{m.offHoursSessions}</td>
                          <td className="py-2.5">{Math.round(m.offHoursMinutes / 60 * 10) / 10}h</td>
                          <td className="py-2.5">
                            <Badge variant={m.offHoursMinutes > 300 ? 'destructive' : m.offHoursMinutes > 120 ? 'secondary' : 'default'} className="text-xs">
                              {m.offHoursMinutes > 300 ? t('adminWorkload.highRisk') : m.offHoursMinutes > 120 ? t('adminWorkload.mediumRisk') : t('adminWorkload.lowRisk')}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {teamLoad.filter(m => m.offHoursMinutes > 0).length === 0 && (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">{t('adminWorkload.noOffHours')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
