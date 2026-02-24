import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useWorkloadAnalytics } from '@/hooks/workload/useWorkloadAnalytics';
import { useObjectives } from '@/hooks/workload/useObjectives';
import { useInitiatives } from '@/hooks/workload/useInitiatives';
import {
  Users, AlertTriangle, Clock, CheckCircle2, TrendingUp,
} from 'lucide-react';

export default function TeamWorkload() {
  const { t } = useTranslation();
  const { teamLoad, isLoading, atRiskCount } = useWorkloadAnalytics();
  const { objectives } = useObjectives();
  const { initiatives } = useInitiatives();

  const riskMembers = useMemo(
    () => teamLoad.filter(m => m.estimatedMinutes > 480 || m.overdueTasks > 2 || m.offHoursMinutes > 120),
    [teamLoad]
  );

  // Quadrants
  const quadrants = useMemo(() => {
    const high = 360; // 6h threshold
    return {
      lowLoadHealthy: teamLoad.filter(m => m.estimatedMinutes <= high && m.overdueTasks === 0),
      highLoadHealthy: teamLoad.filter(m => m.estimatedMinutes > high && m.overdueTasks === 0),
      lowLoadAtRisk: teamLoad.filter(m => m.estimatedMinutes <= high && m.overdueTasks > 0),
      highLoadAtRisk: teamLoad.filter(m => m.estimatedMinutes > high && m.overdueTasks > 0),
    };
  }, [teamLoad]);

  const statCards = [
    { title: t('teamWorkload.teamSize'), value: teamLoad.length, icon: Users },
    { title: t('teamWorkload.atRiskMembers'), value: riskMembers.length, icon: AlertTriangle },
    { title: t('teamWorkload.objContributing'), value: objectives.length, icon: TrendingUp },
    { title: t('teamWorkload.initActive'), value: initiatives.filter(i => i.status !== 'completed').length, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('teamWorkload.pageTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('teamWorkload.pageDesc')}</p>
      </div>

      {/* KPI */}
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

      {/* Risk Alerts */}
      {riskMembers.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t('teamWorkload.riskAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {riskMembers.slice(0, 5).map(m => (
              <div key={m.employeeId} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                <div>
                  <p className="font-medium text-sm">{m.employeeName}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.estimatedMinutes > 480 && `${Math.round(m.estimatedMinutes / 60)}h ${t('teamWorkload.scheduled')}`}
                    {m.overdueTasks > 0 && ` · ${m.overdueTasks} ${t('commandCenter.overdue')}`}
                    {m.offHoursMinutes > 0 && ` · ${Math.round(m.offHoursMinutes / 60)}h ${t('adminWorkload.offHours')}`}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">{t('adminWorkload.atRisk')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Team Load Quadrant */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { key: 'highLoadAtRisk', title: t('teamWorkload.burnoutRisk'), members: quadrants.highLoadAtRisk, variant: 'destructive' as const },
          { key: 'highLoadHealthy', title: t('teamWorkload.thrivingUnderPressure'), members: quadrants.highLoadHealthy, variant: 'secondary' as const },
          { key: 'lowLoadAtRisk', title: t('teamWorkload.needsAttention'), members: quadrants.lowLoadAtRisk, variant: 'secondary' as const },
          { key: 'lowLoadHealthy', title: t('teamWorkload.balanced'), members: quadrants.lowLoadHealthy, variant: 'default' as const },
        ].map(q => (
          <Card key={q.key} className="glass-card border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{q.title}</CardTitle>
                <Badge variant={q.variant} className="text-xs">{q.members.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-16" /> : q.members.length > 0 ? (
                <div className="space-y-1">
                  {q.members.slice(0, 5).map(m => (
                    <div key={m.employeeId} className="flex items-center justify-between text-sm py-1">
                      <span className="truncate">{m.employeeName}</span>
                      <span className="text-muted-foreground text-xs">{Math.round(m.estimatedMinutes / 60)}h</span>
                    </div>
                  ))}
                  {q.members.length > 5 && <p className="text-xs text-muted-foreground">+{q.members.length - 5} {t('common.more')}</p>}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Objective Alignment */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('teamWorkload.objectiveAlignment')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? <Skeleton className="h-20" /> : objectives.length > 0 ? objectives.slice(0, 5).map(obj => (
            <div key={obj.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{obj.title}</span>
                <span className="text-xs text-muted-foreground">{obj.progress}%</span>
              </div>
              <Progress value={obj.progress} className="h-1.5" />
            </div>
          )) : (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('workload.objectives.empty')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
