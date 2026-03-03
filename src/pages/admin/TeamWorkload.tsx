import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, GENERIC_TASK_STATUS_CONFIG } from '@/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useWorkloadAnalytics } from '@/hooks/workload/useWorkloadAnalytics';
import { useObjectives } from '@/hooks/workload/useObjectives';
import { useInitiatives } from '@/hooks/workload/useInitiatives';
import { useDepartmentTasks } from '@/hooks/workload/useDepartmentTasks';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { TeamTaskFilters, type TaskFilters } from '@/components/workload/team/TeamTaskFilters';
import { AddTeamTaskDialog } from '@/components/workload/team/AddTeamTaskDialog';
import { DataTable } from '@/shared/data-table/DataTable';
import {
  Users, AlertTriangle, Clock, CheckCircle2, TrendingUp, Plus,
  Lock, Unlock, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';


const priorityLabels: Record<number, string> = {
  1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4', 5: 'P5',
};

export default function TeamWorkload() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const { teamLoad, isPending: analyticsLoading } = useWorkloadAnalytics();
  const { objectives } = useObjectives();
  const { initiatives } = useInitiatives();
  const {
    employees, tasks, isPending: tasksLoading,
    createTask, deleteTask, lockTask, unlockTask, isCreating,
  } = useDepartmentTasks();

  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all', priority: 'all', employeeId: 'all', sourceType: 'all', search: '',
  });

  // Build employee name map
  const empMap = useMemo(() => {
    const m: Record<string, string> = {};
    employees.forEach(e => { m[e.id] = e.full_name; });
    return m;
  }, [employees]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== parseInt(filters.priority)) return false;
      if (filters.employeeId !== 'all' && task.employee_id !== filters.employeeId) return false;
      if (filters.sourceType !== 'all' && task.source_type !== filters.sourceType) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(s) && !(task.title_ar ?? '').toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [tasks, filters]);

  // Risk members
  const riskMembers = useMemo(
    () => teamLoad.filter(m => m.estimatedMinutes > 480 || m.overdueTasks > 2 || m.offHoursMinutes > 120),
    [teamLoad]
  );

  // Quadrants
  const quadrants = useMemo(() => {
    const high = 360;
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

  const columns = [
    {
      id: 'employee',
      header: t('teamWorkload.employee'),
      cell: (row: typeof filteredTasks[number]) => (
        <span className="font-medium text-sm">{empMap[row.employee_id] ?? '—'}</span>
      ),
    },
    {
      id: 'title',
      header: t('workload.tasks.title'),
      cell: (row: typeof filteredTasks[number]) => (
        <div>
          <p className="text-sm font-medium">{row.title}</p>
          {row.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{row.title_ar}</p>}
        </div>
      ),
    },
    {
      id: 'status',
      header: t('common.status'),
      cell: (row: typeof filteredTasks[number]) => (
        <StatusBadge
          status={row.status}
          config={GENERIC_TASK_STATUS_CONFIG}
          translationPrefix="teamWorkload"
        />
      ),
      className: 'w-28',
    },
    {
      id: 'priority',
      header: t('workload.tasks.priority'),
      cell: (row: typeof filteredTasks[number]) => (
        <Badge variant={row.priority <= 2 ? 'destructive' : 'secondary'} className="text-xs">
          {priorityLabels[row.priority] ?? `P${row.priority}`}
        </Badge>
      ),
      className: 'w-20',
    },
    {
      id: 'dueDate',
      header: t('workload.tasks.dueDate'),
      cell: (row: typeof filteredTasks[number]) => (
        <span className="text-sm text-muted-foreground">
          {row.due_date ? format(new Date(row.due_date), 'MMM dd') : '—'}
        </span>
      ),
      className: 'w-28',
    },
    {
      id: 'estimated',
      header: t('workload.tasks.estimatedMinutes'),
      cell: (row: typeof filteredTasks[number]) => (
        <span className="text-sm text-muted-foreground">
          {row.estimated_minutes ? `${row.estimated_minutes}m` : '—'}
        </span>
      ),
      className: 'w-20',
    },
    {
      id: 'source',
      header: t('teamWorkload.source'),
      cell: (row: typeof filteredTasks[number]) => (
        <span className="text-xs text-muted-foreground capitalize">{row.source_type.replace('_', ' ')}</span>
      ),
      className: 'w-28',
    },
    {
      id: 'actions',
      header: '',
      headerHidden: true,
      cell: (row: typeof filteredTasks[number]) => (
        <div className="flex items-center gap-1">
          {row.is_locked ? (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => unlockTask(row.id)}>
              <Unlock className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => lockTask({ id: row.id, locked_by: user?.id ?? '' })}>
              <Lock className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTask(row.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('teamWorkload.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('teamWorkload.pageDesc')}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('teamWorkload.assignTask')}
        </Button>
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
              {analyticsLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
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
                    {m.overdueTasks > 0 && ` · ${m.overdueTasks} ${t('common.overdue')}`}
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">{t('teamWorkload.atRiskMembers')}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Department Tasks Section */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('teamWorkload.departmentTasks')}</CardTitle>
            <Badge variant="secondary" className="text-xs">{filteredTasks.length} {t('teamWorkload.allTasks')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TeamTaskFilters filters={filters} onChange={setFilters} employees={employees} />
          <DataTable
            columns={columns}
            data={filteredTasks}
            rowKey={row => row.id}
            isLoading={tasksLoading}
            emptyMessage={t('teamWorkload.noTasksFound')}
            emptyIcon={<CheckCircle2 className="h-8 w-8 text-muted-foreground" />}
            bordered={false}
          />
        </CardContent>
      </Card>

      {/* Quadrants */}
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
              {analyticsLoading ? <Skeleton className="h-16" /> : q.members.length > 0 ? (
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
          {analyticsLoading ? <Skeleton className="h-20" /> : objectives.length > 0 ? objectives.slice(0, 5).map(obj => (
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

      {/* Add Task Dialog */}
      {tenantId && user?.id && (
        <AddTeamTaskDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          employees={employees}
          tenantId={tenantId}
          createdBy={user.id}
          onSubmit={createTask}
          isCreating={isCreating}
        />
      )}
    </div>
  );
}
