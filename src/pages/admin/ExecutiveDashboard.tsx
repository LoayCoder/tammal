import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useObjectives } from '@/hooks/workload/useObjectives';
import { useInitiatives } from '@/hooks/workload/useInitiatives';
import { useWorkloadAnalytics } from '@/hooks/workload/useWorkloadAnalytics';
import { useWorkloadMetrics } from '@/hooks/workload/useWorkloadMetrics';
import { useExecutionVelocity } from '@/hooks/workload/useExecutionVelocity';
import { useWorkloadHeatmap } from '@/hooks/workload/useWorkloadHeatmap';
import { useInitiativeRisk } from '@/hooks/workload/useInitiativeRisk';
import { useRunAnalyticsSnapshot } from '@/hooks/workload/useWorkloadIntelligence';
import { toast } from 'sonner';
import {
  Target, TrendingUp, AlertTriangle, Users, Activity, Shield,
  Zap, BarChart3, RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer, RadialBarChart, RadialBar, Legend,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
};

const HEATMAP_COLORS: Record<string, string> = {
  underutilized: 'hsl(var(--chart-1))',
  healthy: 'hsl(var(--chart-2))',
  high_load: 'hsl(var(--chart-4))',
  burnout_risk: 'hsl(var(--destructive))',
};

export default function ExecutiveDashboard() {
  const { t } = useTranslation();
  const { objectives, isPending: objLoading } = useObjectives();
  const { initiatives, isPending: initLoading } = useInitiatives();
  const { teamLoad, totalEmployees, atRiskCount, isPending: analyticsLoading } = useWorkloadAnalytics();
  const { metrics, isPending: metricsLoading } = useWorkloadMetrics();
  const { avgVelocity, totalCompleted, isPending: velocityLoading } = useExecutionVelocity();
  const { distribution, isPending: heatmapLoading } = useWorkloadHeatmap();
  const { metrics: riskMetrics, highRisk, isPending: riskLoading } = useInitiativeRisk();
  const snapshotMutation = useRunAnalyticsSnapshot();

  const isPending = objLoading || initLoading || analyticsLoading || metricsLoading;

  const handleSnapshot = async () => {
    try {
      await snapshotMutation.mutateAsync('compute_velocity');
      await snapshotMutation.mutateAsync('snapshot_heatmap');
      await snapshotMutation.mutateAsync('compute_initiative_risk');
      await snapshotMutation.mutateAsync('snapshot_alignment');
      toast.success(t('executive.snapshotSuccess'));
    } catch {
      toast.error('Snapshot failed');
    }
  };

  // Strategic progress
  const avgObjProgress = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + (o.progress ?? 0), 0) / objectives.length)
    : 0;
  const avgInitProgress = initiatives.length > 0
    ? Math.round(initiatives.reduce((s, i) => s + (i.progress ?? 0), 0) / initiatives.length)
    : 0;

  // Capacity utilization
  const avgUtilization = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.utilization_percentage, 0) / metrics.length)
    : 0;
  const avgBurnoutRisk = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.burnout_risk_score, 0) / metrics.length)
    : 0;
  const avgAlignment = metrics.length > 0
    ? Math.round(metrics.reduce((s, m) => s + m.alignment_score, 0) / metrics.length)
    : 0;

  const burnoutRiskEmployees = metrics.filter(m => m.burnout_risk_score > 60).length;

  // Completion rate from teamLoad
  const totalTasks = teamLoad.reduce((s, m) => s + m.totalTasks, 0);
  const totalDone = teamLoad.reduce((s, m) => s + m.doneTasks, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const totalOverdue = teamLoad.reduce((s, m) => s + m.overdueTasks, 0);
  const overdueRate = totalTasks > 0 ? Math.round((totalOverdue / totalTasks) * 100) : 0;

  const statCards = [
    { title: t('executive.strategicProgress'), value: `${avgObjProgress}%`, icon: Target },
    { title: t('executive.initiativeProgress'), value: `${avgInitProgress}%`, icon: TrendingUp },
    { title: t('executive.workforceUtilization'), value: `${avgUtilization}%`, icon: Activity },
    { title: t('executive.burnoutRiskCount'), value: burnoutRiskEmployees, icon: AlertTriangle },
    { title: t('executive.alignmentScore'), value: `${avgAlignment}%`, icon: Shield },
    { title: t('executive.totalWorkforce'), value: totalEmployees, icon: Users },
  ];

  const radialData = [
    { name: t('executive.objectives'), value: avgObjProgress, fill: 'hsl(var(--chart-1))' },
    { name: t('executive.initiatives'), value: avgInitProgress, fill: 'hsl(var(--chart-2))' },
  ];

  // Department workload chart
  const deptRisk = teamLoad.reduce<Record<string, { total: number; atRisk: number; avgLoad: number }>>((acc, m) => {
    const dept = m.department ?? t('common.unassigned');
    if (!acc[dept]) acc[dept] = { total: 0, atRisk: 0, avgLoad: 0 };
    acc[dept].total++;
    acc[dept].avgLoad += m.estimatedMinutes;
    if (m.estimatedMinutes > 480 || m.overdueTasks > 2) acc[dept].atRisk++;
    return acc;
  }, {});
  const deptChart = Object.entries(deptRisk).map(([dept, data]) => ({
    name: dept.length > 15 ? dept.slice(0, 15) + '…' : dept,
    avgHours: Math.round((data.avgLoad / data.total / 60) * 10) / 10,
    atRisk: data.atRisk,
    total: data.total,
  })).sort((a, b) => b.avgHours - a.avgHours).slice(0, 8);

  // Heatmap distribution chart
  const heatmapChart = [
    { name: t('executive.underutilized'), value: distribution.underutilized, fill: HEATMAP_COLORS.underutilized },
    { name: t('executive.healthy'), value: distribution.healthy, fill: HEATMAP_COLORS.healthy },
    { name: t('executive.highLoad'), value: distribution.high_load, fill: HEATMAP_COLORS.high_load },
    { name: t('executive.burnoutRiskLabel'), value: distribution.burnout_risk, fill: HEATMAP_COLORS.burnout_risk },
  ];

  // Initiative names map for risk radar
  const initMap: Record<string, string> = {};
  initiatives.forEach(i => { initMap[i.id] = i.title; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('executive.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('executive.pageDesc')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSnapshot}
          disabled={snapshotMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${snapshotMutation.isPending ? 'animate-spin' : ''}`} />
          {snapshotMutation.isPending ? t('executive.snapshotRunning') : t('executive.runSnapshot')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map(stat => (
          <Card key={stat.title} className="glass-stat border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium truncate">{stat.title}</CardTitle>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <stat.icon className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isPending ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Strategic Progress Radial */}
        <Card className="glass-chart border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('executive.strategicOverview')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? <Skeleton className="h-[280px] w-full" /> : (
              <ResponsiveContainer width="100%" height={280}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                  <RadialBar dataKey="value" cornerRadius={8} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={GLASS_TOOLTIP} formatter={(v: number) => [`${v}%`]} />
                </RadialBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Department Workload */}
        <Card className="glass-chart border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('executive.departmentWorkload')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? <Skeleton className="h-[280px] w-full" /> : deptChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptChart} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={GLASS_TOOLTIP} />
                  <Bar dataKey="avgHours" fill="hsl(var(--primary))" name={t('executive.avgHours')} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Performance */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            {t('executive.deliveryPerformance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold">{avgVelocity}</p>
              <p className="text-xs text-muted-foreground">{t('executive.executionVelocity')} ({t('executive.actionsPerDay')})</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">{t('executive.onTimeCompletion')}</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">{t('teamWorkload.completionRate')}</p>
            </div>
            <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
              <p className="text-3xl font-bold">{overdueRate}%</p>
              <p className="text-xs text-muted-foreground">{t('teamWorkload.overdueRate')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workforce Health Heatmap */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('executive.heatmapTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {heatmapLoading ? <Skeleton className="h-[200px]" /> : (
              heatmapChart.some(h => h.value > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={heatmapChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={GLASS_TOOLTIP} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {heatmapChart.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">{t('executive.noHeatmapData')}</p>
              )
            )}
          </CardContent>
        </Card>

        {/* Initiative Risk Radar */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-destructive" />
              {t('executive.initiativeRiskRadar')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {riskLoading ? <Skeleton className="h-[200px]" /> : riskMetrics.length > 0 ? (
              <div className="space-y-3">
                {riskMetrics.slice(0, 5).map(r => (
                  <div key={r.initiative_id} className="space-y-1.5 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">{initMap[r.initiative_id] ?? r.initiative_id}</span>
                      <Badge variant={r.risk_score > 60 ? 'destructive' : r.risk_score > 30 ? 'secondary' : 'default'} className="text-xs">
                        {r.risk_score}%
                      </Badge>
                    </div>
                    <Progress value={r.risk_score} className="h-1.5" />
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{t('executive.overdueRisk')}: {r.overdue_score}%</span>
                      <span>{t('executive.velocityRisk')}: {r.velocity_score}%</span>
                      <span>{t('executive.resourceRisk')}: {r.resource_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-10">{t('executive.noRiskData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Burnout Risk Map */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t('executive.burnoutRiskMap')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-32" /> : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {metrics.filter(m => m.burnout_risk_score > 30).sort((a, b) => b.burnout_risk_score - a.burnout_risk_score).slice(0, 9).map(m => {
                const emp = teamLoad.find(t => t.employeeId === m.employee_id);
                return (
                  <div key={m.employee_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{emp?.employeeName ?? m.employee_id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={m.burnout_risk_score} className="h-1.5 flex-1" />
                        <span className="text-xs font-semibold">{Math.round(m.burnout_risk_score)}%</span>
                      </div>
                    </div>
                    <Badge variant={m.burnout_risk_score > 60 ? 'destructive' : 'secondary'} className="text-xs shrink-0">
                      {m.burnout_risk_score > 60 ? t('adminWorkload.highRisk') : t('adminWorkload.mediumRisk')}
                    </Badge>
                  </div>
                );
              })}
              {metrics.filter(m => m.burnout_risk_score > 30).length === 0 && (
                <p className="text-muted-foreground text-sm col-span-full text-center py-8">{t('executive.noBurnoutRisks')}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alignment Overview */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('executive.organizationAlignment')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? <Skeleton className="h-20" /> : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{avgAlignment}%</p>
                <p className="text-xs text-muted-foreground">{t('executive.overallAlignment')}</p>
              </div>
              <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{avgUtilization}%</p>
                <p className="text-xs text-muted-foreground">{t('executive.overallUtilization')}</p>
              </div>
              <div className="text-center space-y-2 p-4 rounded-lg bg-muted/30">
                <p className="text-3xl font-bold">{atRiskCount}</p>
                <p className="text-xs text-muted-foreground">{t('executive.employeesAtRisk')}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
