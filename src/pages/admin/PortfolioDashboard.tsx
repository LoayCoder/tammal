import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useObjectives } from '@/hooks/workload/useObjectives';
import { useInitiatives } from '@/hooks/workload/useInitiatives';
import { useWorkloadAnalytics } from '@/hooks/workload/useWorkloadAnalytics';
import {
  Target, TrendingUp, AlertTriangle, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
};

const STATUS_COLORS: Record<string, string> = {
  on_track: 'hsl(var(--chart-1))',
  at_risk: 'hsl(var(--chart-4))',
  delayed: 'hsl(var(--destructive))',
  not_started: 'hsl(var(--muted-foreground))',
  completed: 'hsl(var(--chart-2))',
};

function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'on_track' || status === 'completed') return 'default';
  if (status === 'delayed') return 'destructive';
  return 'secondary';
}

export default function PortfolioDashboard() {
  const { t } = useTranslation();
  const { objectives, isPending: objLoading } = useObjectives();
  const { initiatives, isPending: initLoading } = useInitiatives();
  const { objProgress, isPending: analyticsLoading } = useWorkloadAnalytics();

  const isPending = objLoading || initLoading || analyticsLoading;

  const activeInits = initiatives.filter(i => i.status !== 'completed');
  const atRiskObjs = objectives.filter(o => o.status === 'at_risk' || o.status === 'delayed');

  const statCards = [
    { title: t('portfolio.totalObjectives'), value: objectives.length, icon: Target },
    { title: t('portfolio.activeInitiatives'), value: activeInits.length, icon: Layers },
    { title: t('portfolio.atRisk'), value: atRiskObjs.length, icon: AlertTriangle },
    { title: t('portfolio.avgProgress'), value: `${objectives.length > 0 ? Math.round(objectives.reduce((s, o) => s + (o.progress ?? 0), 0) / objectives.length) : 0}%`, icon: TrendingUp },
  ];

  // Status distribution for pie chart
  const statusCounts = objectives.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: t(`portfolio.status.${status}`, status),
    value: count,
    fill: STATUS_COLORS[status] ?? 'hsl(var(--muted-foreground))',
  }));

  // Progress bar chart
  const progressChart = objProgress.slice(0, 10).map(obj => ({
    name: obj.title.length > 20 ? obj.title.slice(0, 20) + '…' : obj.title,
    progress: obj.progress,
    actions: obj.actionCount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('portfolio.pageTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('portfolio.pageDesc')}</p>
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
              {isPending ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-tabs border-0 h-auto">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">
            {t('portfolio.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="initiatives" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">
            {t('portfolio.tabs.initiatives')}
          </TabsTrigger>
          <TabsTrigger value="risk" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">
            {t('portfolio.tabs.risk')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Distribution */}
            <Card className="glass-chart border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('portfolio.statusDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPending ? <Skeleton className="h-[260px] w-full" /> : pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={GLASS_TOOLTIP} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Objective Progress */}
            <Card className="glass-chart border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('portfolio.objectiveProgress')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPending ? <Skeleton className="h-[260px] w-full" /> : progressChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={progressChart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={GLASS_TOOLTIP} formatter={(v: number) => [`${v}%`, t('common.progress')]} />
                      <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Objectives List */}
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('portfolio.allObjectives')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? <Skeleton className="h-40" /> : (
                <div className="space-y-3">
                  {objProgress.map(obj => (
                    <div key={obj.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{obj.title}</h3>
                          <Badge variant={getStatusVariant(obj.status)} className="text-xs shrink-0">
                            {t(`portfolio.status.${obj.status}`, obj.status)}
                          </Badge>
                        </div>
                        <Progress value={obj.progress} className="h-1.5" />
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{obj.quarter} {obj.year}</span>
                          <span>{obj.initiativeCount} {t('portfolio.initiatives')}</span>
                          <span>{obj.completedActions}/{obj.actionCount} {t('portfolio.actions')}</span>
                          <span className="ms-auto font-semibold text-foreground">{obj.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {objProgress.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initiatives Tab */}
        <TabsContent value="initiatives" className="space-y-4">
          {isPending ? <Skeleton className="h-40" /> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {initiatives.map(init => (
                <Card key={init.id} className="glass-card border-0">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">{init.title}</h3>
                      <Badge variant={getStatusVariant(init.status)} className="text-xs shrink-0">
                        {t(`portfolio.status.${init.status}`, init.status)}
                      </Badge>
                    </div>
                    <Progress value={init.progress ?? 0} className="h-2" />
                    <div className="text-xs text-muted-foreground flex items-center justify-between">
                      <span>{init.progress ?? 0}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {initiatives.length === 0 && (
                <Card className="glass-card border-0 col-span-full">
                  <CardContent className="p-10 text-center text-muted-foreground">{t('common.noData')}</CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {t('portfolio.riskHeatmap')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPending ? <Skeleton className="h-40" /> : atRiskObjs.length > 0 ? (
                <div className="space-y-3">
                  {atRiskObjs.map(obj => (
                    <div key={obj.id} className="flex items-center gap-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{obj.title}</h3>
                          <Badge variant="destructive" className="text-xs shrink-0">
                            {t(`portfolio.status.${obj.status}`, obj.status)}
                          </Badge>
                        </div>
                        <Progress value={obj.progress ?? 0} className="h-1.5" />
                        <p className="text-xs text-muted-foreground">{obj.progress ?? 0}% — {obj.quarter} {obj.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('portfolio.noRisks')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
