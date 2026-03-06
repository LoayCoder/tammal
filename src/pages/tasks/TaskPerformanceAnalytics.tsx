import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts';
import {
  CheckCircle, Clock, TrendingUp, Users, AlertTriangle, Target,
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RangeKey = '7' | '14' | '30';

export default function TaskPerformanceAnalytics() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const [range, setRange] = useState<RangeKey>('30');

  const sinceDate = useMemo(() => startOfDay(subDays(new Date(), Number(range))).toISOString(), [range]);

  // Fetch all unified_tasks for this tenant within range
  const { data: tasks, isPending } = useQuery({
    queryKey: ['task-perf-analytics', tenantId, range],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('id, status, priority, progress, created_at, updated_at, employee_id, employees!unified_tasks_employee_id_fkey(full_name)')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .gte('created_at', sinceDate)
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // ── Derived metrics ───────────────────────
  const metrics = useMemo(() => {
    if (!tasks?.length) return null;

    const total = tasks.length;
    const completed = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgress = tasks.filter((t: any) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t: any) => t.status === 'rejected' || t.status === 'archived').length;
    const avgProgress = Math.round(tasks.reduce((sum: number, t: any) => sum + (t.progress ?? 0), 0) / total);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status distribution
    const statusCounts: Record<string, number> = {};
    tasks.forEach((t: any) => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Priority distribution
    const priorityCounts: Record<string, number> = {};
    tasks.forEach((t: any) => {
      const p = t.priority || 'medium';
      priorityCounts[p] = (priorityCounts[p] || 0) + 1;
    });
    const priorityData = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

    // Daily creation trend
    const days = eachDayOfInterval({ start: new Date(sinceDate), end: new Date() });
    const dailyMap: Record<string, { created: number; completed: number }> = {};
    days.forEach(d => {
      dailyMap[format(d, 'MM/dd')] = { created: 0, completed: 0 };
    });
    tasks.forEach((t: any) => {
      const key = format(new Date(t.created_at), 'MM/dd');
      if (dailyMap[key]) dailyMap[key].created++;
      if (t.status === 'completed') {
        const uKey = format(new Date(t.updated_at), 'MM/dd');
        if (dailyMap[uKey]) dailyMap[uKey].completed++;
      }
    });
    const trendData = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

    // Top performers (by completed tasks count)
    const employeeMap: Record<string, { name: string; completed: number; total: number }> = {};
    tasks.forEach((t: any) => {
      const eid = t.employee_id;
      if (!eid) return;
      if (!employeeMap[eid]) {
        const empName = (t.employees as any)?.full_name ?? 'Unknown';
        employeeMap[eid] = { name: empName, completed: 0, total: 0 };
      }
      employeeMap[eid].total++;
      if (t.status === 'completed') employeeMap[eid].completed++;
    });
    const topPerformers = Object.values(employeeMap)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);

    return { total, completed, inProgress, overdue, avgProgress, completionRate, statusData, priorityData, trendData, topPerformers };
  }, [tasks, sinceDate]);

  const STATUS_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];
  const PRIORITY_COLORS: Record<string, string> = {
    critical: 'hsl(var(--destructive))',
    high: 'hsl(var(--chart-5))',
    medium: 'hsl(var(--chart-4))',
    low: 'hsl(var(--chart-2))',
  };

  if (isPending) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('taskAnalytics.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('taskAnalytics.subtitle')}</p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('taskAnalytics.last7')}</SelectItem>
            <SelectItem value="14">{t('taskAnalytics.last14')}</SelectItem>
            <SelectItem value="30">{t('taskAnalytics.last30')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!metrics ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">{t('common.noData')}</CardContent></Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard icon={Target} label={t('taskAnalytics.totalTasks')} value={metrics.total} />
            <KPICard icon={CheckCircle} label={t('taskAnalytics.completionRate')} value={`${metrics.completionRate}%`} />
            <KPICard icon={TrendingUp} label={t('taskAnalytics.avgProgress')} value={`${metrics.avgProgress}%`} />
            <KPICard icon={Clock} label={t('taskAnalytics.inProgress')} value={metrics.inProgress} />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t('taskAnalytics.dailyTrend')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={metrics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="created" stackId="1" fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.3} name={t('taskAnalytics.created')} />
                    <Area type="monotone" dataKey="completed" stackId="2" fill="hsl(var(--chart-2))" stroke="hsl(var(--chart-2))" fillOpacity={0.3} name={t('taskAnalytics.completed')} />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t('taskAnalytics.statusDistribution')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={metrics.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {metrics.statusData.map((_: any, i: number) => (
                        <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t('taskAnalytics.priorityBreakdown')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={metrics.priorityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {metrics.priorityData.map((entry: any, i: number) => (
                        <Cell key={i} fill={PRIORITY_COLORS[entry.name] || 'hsl(var(--muted-foreground))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader><CardTitle className="text-base">{t('taskAnalytics.topPerformers')}</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={metrics.topPerformers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="completed" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} name={t('taskAnalytics.completed')} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name={t('taskAnalytics.totalTasks')} opacity={0.4} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="p-2.5 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
