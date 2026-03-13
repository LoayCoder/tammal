import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { StatusBadge, GENERIC_TASK_STATUS_CONFIG } from '@/shared/status-badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { useWorkloadAnalytics, useObjectives, useInitiatives, useDepartmentTasks } from '@/features/workload';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { TeamTaskFilters, type TaskFilters } from '@/features/workload/components/team/TeamTaskFilters';
import { AddTeamTaskDialog } from '@/features/workload/components/team/AddTeamTaskDialog';
import { TeamStatCards } from '@/features/workload/components/team/TeamStatCards';
import { WorkloadDistributionChart } from '@/features/workload/components/team/WorkloadDistributionChart';
import { ExecutionMetricsCard } from '@/features/workload/components/team/ExecutionMetricsCard';
import { RiskAlertsCard } from '@/features/workload/components/team/RiskAlertsCard';
import { TeamMemberAccordion } from '@/features/workload/components/team/TeamMemberAccordion';
import {
  Users, AlertTriangle, TrendingUp, CheckCircle2, Plus,
  Lock, Unlock, Trash2, Search,
} from 'lucide-react';
import { format } from 'date-fns';

const priorityLabels: Record<number, string> = { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4', 5: 'P5' };

interface MemberSummary {
  id: string; name: string; role: string | null; department: string | null;
  active: number; completed: number; overdue: number; highPriority: number; avgProgress: number; total: number;
}

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
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({ status: 'all', priority: 'all', employeeId: 'all', sourceType: 'all', search: '' });
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'overdue' | 'active' | 'progress'>('overdue');

  const now = new Date();

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

  const tasksByEmployee = useMemo(() => {
    const map = new Map<string, typeof filteredTasks>();
    filteredTasks.forEach(task => {
      const list = map.get(task.employee_id) ?? [];
      list.push(task);
      map.set(task.employee_id, list);
    });
    return map;
  }, [filteredTasks]);

  const memberSummaries = useMemo<MemberSummary[]>(() => {
    const summaries = employees.map(emp => {
      const empTasks = tasksByEmployee.get(emp.id) ?? [];
      const active = empTasks.filter(t => !['completed', 'archived', 'rejected'].includes(t.status));
      const completed = empTasks.filter(t => t.status === 'completed');
      const overdue = active.filter(t => t.due_date && new Date(t.due_date) < now);
      const highPriority = active.filter(t => t.priority <= 1);
      const avgProgress = active.length > 0 ? Math.round(active.reduce((sum, t) => sum + (t.progress ?? 0), 0) / active.length) : 0;
      return { id: emp.id, name: emp.full_name, role: emp.role_title ?? null, department: null, active: active.length, completed: completed.length, overdue: overdue.length, highPriority: highPriority.length, avgProgress, total: empTasks.length };
    });

    let result = memberSearch.trim() ? summaries.filter(s => s.name.toLowerCase().includes(memberSearch.toLowerCase())) : summaries;
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'overdue': return b.overdue - a.overdue;
        case 'active': return b.active - a.active;
        case 'progress': return a.avgProgress - b.avgProgress;
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [employees, tasksByEmployee, memberSearch, sortBy, now]);

  const riskMembers = useMemo(
    () => teamLoad.filter(m => m.estimatedMinutes > 480 || m.overdueTasks > 2 || m.offHoursMinutes > 120),
    [teamLoad]
  );

  const totalTasks = teamLoad.reduce((s, m) => s + m.totalTasks, 0);
  const totalDone = teamLoad.reduce((s, m) => s + m.doneTasks, 0);
  const totalOverdue = teamLoad.reduce((s, m) => s + m.overdueTasks, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const overdueRate = totalTasks > 0 ? Math.round((totalOverdue / totalTasks) * 100) : 0;
  const velocity = totalTasks > 0 ? Math.round((totalDone / 30) * 100) / 100 : 0;

  const workloadDistribution = useMemo(() => {
    const classify = (minutes: number) => {
      const pct = (minutes / 480) * 100;
      if (pct < 60) return 'underutilized';
      if (pct <= 90) return 'healthy';
      if (pct <= 110) return 'high_load';
      return 'burnout_risk';
    };
    const counts = { underutilized: 0, healthy: 0, high_load: 0, burnout_risk: 0 };
    teamLoad.forEach(m => { counts[classify(m.estimatedMinutes) as keyof typeof counts]++; });
    return [
      { name: t('executive.underutilized'), value: counts.underutilized, fill: 'hsl(var(--chart-1))' },
      { name: t('executive.healthy'), value: counts.healthy, fill: 'hsl(var(--chart-2))' },
      { name: t('executive.highLoad'), value: counts.high_load, fill: 'hsl(var(--chart-4))' },
      { name: t('executive.burnoutRiskLabel'), value: counts.burnout_risk, fill: 'hsl(var(--destructive))' },
    ];
  }, [teamLoad, t]);

  const statCards = [
    { title: t('teamWorkload.teamSize'), value: teamLoad.length, icon: Users },
    { title: t('teamWorkload.atRiskMembers'), value: riskMembers.length, icon: AlertTriangle },
    { title: t('teamWorkload.objContributing'), value: objectives.length, icon: TrendingUp },
    { title: t('teamWorkload.initActive'), value: initiatives.filter(i => i.status !== 'completed').length, icon: CheckCircle2 },
  ];

  const memberTaskColumns = [
    {
      id: 'title', header: t('workload.tasks.title'),
      cell: (row: typeof filteredTasks[number]) => (
        <div>
          <p className="text-sm font-medium">{row.title}</p>
          {row.title_ar && <p className="text-xs text-muted-foreground" dir="rtl">{row.title_ar}</p>}
        </div>
      ),
    },
    {
      id: 'status', header: t('common.status'), className: 'w-28',
      cell: (row: typeof filteredTasks[number]) => <StatusBadge status={row.status} config={GENERIC_TASK_STATUS_CONFIG} translationPrefix="teamWorkload" />,
    },
    {
      id: 'priority', header: t('workload.tasks.priority'), className: 'w-20',
      cell: (row: typeof filteredTasks[number]) => <Badge variant={row.priority <= 2 ? 'destructive' : 'secondary'} className="text-xs">{priorityLabels[row.priority] ?? `P${row.priority}`}</Badge>,
    },
    {
      id: 'dueDate', header: t('workload.tasks.dueDate'), className: 'w-28',
      cell: (row: typeof filteredTasks[number]) => <span className="text-sm text-muted-foreground">{row.due_date ? format(new Date(row.due_date), 'MMM dd') : '—'}</span>,
    },
    {
      id: 'estimated', header: t('workload.tasks.estimatedMinutes'), className: 'w-20',
      cell: (row: typeof filteredTasks[number]) => <span className="text-sm text-muted-foreground">{row.estimated_minutes ? `${row.estimated_minutes}m` : '—'}</span>,
    },
    {
      id: 'source', header: t('teamWorkload.source'), className: 'w-28',
      cell: (row: typeof filteredTasks[number]) => <span className="text-xs text-muted-foreground capitalize">{row.source_type.replace('_', ' ')}</span>,
    },
    {
      id: 'actions', header: '', headerHidden: true, className: 'w-20',
      cell: (row: typeof filteredTasks[number]) => (
        <div className="flex items-center gap-1">
          {row.is_locked ? (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => unlockTask(row.id)}><Unlock className="h-3.5 w-3.5" /></Button>
          ) : (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => lockTask({ id: row.id, locked_by: user?.id ?? '' })}><Lock className="h-3.5 w-3.5" /></Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteTask(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('teamWorkload.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('teamWorkload.pageDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{t('teamWorkload.quickAssign')}</Button>
          <Button onClick={() => setEnterpriseModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{t('tasks.createTask')}</Button>
        </div>
      </div>

      <TeamStatCards cards={statCards} isLoading={analyticsLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <WorkloadDistributionChart data={workloadDistribution} isLoading={analyticsLoading} />
        <ExecutionMetricsCard velocity={velocity} completionRate={completionRate} overdueRate={overdueRate} />
      </div>

      <RiskAlertsCard members={riskMembers} />

      {/* Team Members */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('teamWorkload.departmentTasks')}</CardTitle>
            <Badge variant="secondary" className="text-xs">{filteredTasks.length} {t('teamWorkload.allTasks')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <TeamTaskFilters filters={filters} onChange={setFilters} employees={employees} />
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder={t('tasks.managerOverview.searchMembers')} className="ps-9 h-9" />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overdue">{t('tasks.managerOverview.sortOverdue')}</SelectItem>
                <SelectItem value="active">{t('tasks.managerOverview.sortActive')}</SelectItem>
                <SelectItem value="progress">{t('tasks.managerOverview.sortProgress')}</SelectItem>
                <SelectItem value="name">{t('tasks.managerOverview.sortName')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TeamMemberAccordion members={memberSummaries} tasksByEmployee={tasksByEmployee} taskColumns={memberTaskColumns} isLoading={tasksLoading} />
        </CardContent>
      </Card>

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

      {tenantId && user?.id && (
        <AddTeamTaskDialog open={addOpen} onOpenChange={setAddOpen} employees={employees} tenantId={tenantId} createdBy={user.id} onSubmit={createTask} isCreating={isCreating} />
      )}
      {user?.id && (
        <CreateTaskModal open={enterpriseModalOpen} onOpenChange={setEnterpriseModalOpen} employeeId={user.id} />
      )}
    </div>
  );
}


