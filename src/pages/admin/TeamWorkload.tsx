import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, GENERIC_TASK_STATUS_CONFIG } from '@/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useWorkloadAnalytics, useObjectives, useInitiatives, useDepartmentTasks } from '@/features/workload';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { TeamTaskFilters, type TaskFilters } from '@/components/workload/team/TeamTaskFilters';
import { AddTeamTaskDialog } from '@/components/workload/team/AddTeamTaskDialog';
import { DataTable } from '@/shared/data-table/DataTable';
import {
  Users, AlertTriangle, Clock, CheckCircle2, TrendingUp, Plus,
  Lock, Unlock, Trash2, Zap, BarChart3, Search, Flame, ListChecks,
} from 'lucide-react';
import { format } from 'date-fns';
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

const priorityLabels: Record<number, string> = {
  1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4', 5: 'P5',
};

interface MemberSummary {
  id: string;
  name: string;
  role: string | null;
  department: string | null;
  active: number;
  completed: number;
  overdue: number;
  highPriority: number;
  avgProgress: number;
  total: number;
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
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all', priority: 'all', employeeId: 'all', sourceType: 'all', search: '',
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'overdue' | 'active' | 'progress'>('overdue');

  const now = new Date();

  const empMap = useMemo(() => {
    const m: Record<string, { name: string; role: string | null; department: string | null }> = {};
    employees.forEach(e => { m[e.id] = { name: e.full_name, role: e.role_title ?? null, department: null }; });
    return m;
  }, [employees]);

  // Global filtered tasks
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

  // Group tasks by employee + compute summaries
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
    // Build from employees list, include all even with 0 tasks
    const summaries = employees.map(emp => {
      const empTasks = tasksByEmployee.get(emp.id) ?? [];
      const active = empTasks.filter(t => !['completed', 'archived', 'rejected'].includes(t.status));
      const completed = empTasks.filter(t => t.status === 'completed');
      const overdue = active.filter(t => t.due_date && new Date(t.due_date) < now);
      const highPriority = active.filter(t => t.priority <= 1);
      const avgProgress = active.length > 0
        ? Math.round(active.reduce((sum, t) => sum + (t.progress ?? 0), 0) / active.length)
        : 0;

      return {
        id: emp.id,
        name: emp.full_name,
        role: emp.role_title ?? null,
        department: null,
        active: active.length,
        completed: completed.length,
        overdue: overdue.length,
        highPriority: highPriority.length,
        avgProgress,
        total: empTasks.length,
      };
    });

    // Filter by member search
    let result = summaries;
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q));
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'overdue': return b.overdue - a.overdue;
        case 'active': return b.active - a.active;
        case 'progress': return a.avgProgress - b.avgProgress;
        default: return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [employees, tasksByEmployee, memberSearch, sortBy, now]);

  const riskMembers = useMemo(
    () => teamLoad.filter(m => m.estimatedMinutes > 480 || m.overdueTasks > 2 || m.offHoursMinutes > 120),
    [teamLoad]
  );

  // Execution metrics
  const totalTasks = teamLoad.reduce((s, m) => s + m.totalTasks, 0);
  const totalDone = teamLoad.reduce((s, m) => s + m.doneTasks, 0);
  const totalOverdue = teamLoad.reduce((s, m) => s + m.overdueTasks, 0);
  const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const overdueRate = totalTasks > 0 ? Math.round((totalOverdue / totalTasks) * 100) : 0;
  const velocity = totalTasks > 0 ? Math.round((totalDone / 30) * 100) / 100 : 0;

  // Workload distribution by classification
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

  // Per-employee task table columns (no employee column needed)
  const memberTaskColumns = [
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
        <StatusBadge status={row.status} config={GENERIC_TASK_STATUS_CONFIG} translationPrefix="teamWorkload" />
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('teamWorkload.quickAssign')}
          </Button>
          <Button onClick={() => setEnterpriseModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('tasks.createTask')}
          </Button>
        </div>
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

      {/* Workload Distribution + Execution Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-chart border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {t('teamWorkload.workloadDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? <Skeleton className="h-[200px]" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={workloadDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={GLASS_TOOLTIP} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {workloadDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {t('teamWorkload.executionMetrics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3">
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{velocity}</p>
                <p className="text-xs text-muted-foreground">{t('teamWorkload.teamVelocity')}</p>
              </div>
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground">{t('teamWorkload.completionRate')}</p>
              </div>
              <div className="text-center space-y-1 p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{overdueRate}%</p>
                <p className="text-xs text-muted-foreground">{t('teamWorkload.overdueRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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

      {/* Team Members Accordion Section */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('teamWorkload.departmentTasks')}</CardTitle>
            <Badge variant="secondary" className="text-xs">{filteredTasks.length} {t('teamWorkload.allTasks')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Task-level filters */}
          <TeamTaskFilters filters={filters} onChange={setFilters} employees={employees} />

          {/* Member search + sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={t('tasks.managerOverview.searchMembers')}
                className="ps-9 h-9"
              />
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

          {/* Accordion grouped by employee */}
          {tasksLoading ? <Skeleton className="h-64" /> : memberSummaries.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">{t('teamWorkload.noTasksFound')}</div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {memberSummaries.map(member => {
                const memberTasks = tasksByEmployee.get(member.id) ?? [];
                const overdueRatio = member.active > 0 ? member.overdue / member.active : 0;
                const riskLevel = overdueRatio > 0.5 ? 'high' : overdueRatio > 0.25 ? 'medium' : 'low';

                return (
                  <AccordionItem key={member.id} value={member.id} className="border rounded-lg bg-muted/10 px-1">
                    <AccordionTrigger className="py-3 px-3 hover:no-underline">
                      <div className="flex flex-1 items-center justify-between me-3">
                        {/* Left: Name + role + department */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{member.name}</span>
                              {riskLevel === 'high' && (
                                <Badge variant="destructive" className="gap-1 text-[10px] py-0 px-1.5">
                                  <Flame className="h-2.5 w-2.5" />{t('tasks.managerOverview.atRisk')}
                                </Badge>
                              )}
                              {riskLevel === 'medium' && (
                                <Badge className="bg-chart-5/10 text-chart-5 gap-1 text-[10px] py-0 px-1.5">
                                  <AlertTriangle className="h-2.5 w-2.5" />{t('tasks.managerOverview.warning')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {member.role && <span>{member.role}</span>}
                              {member.role && member.department && <span>·</span>}
                              {member.department && <span>{member.department}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Right: Mini-stats */}
                        <div className="hidden sm:flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs font-bold">{member.active}</div>
                            <p className="text-[9px] text-muted-foreground">{t('tasks.stats.active')}</p>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-chart-1">{member.completed}</div>
                            <p className="text-[9px] text-muted-foreground">{t('tasks.stats.completed')}</p>
                          </div>
                          <div className="text-center">
                            <div className={`text-xs font-bold ${member.overdue > 0 ? 'text-destructive' : ''}`}>{member.overdue}</div>
                            <p className="text-[9px] text-muted-foreground">{t('tasks.stats.overdue')}</p>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-bold text-chart-5">{member.highPriority}</div>
                            <p className="text-[9px] text-muted-foreground">P1</p>
                          </div>
                          <div className="w-20">
                            <div className="flex items-center justify-between text-[9px] mb-0.5">
                              <span className="text-muted-foreground">{t('tasks.managerOverview.avgProgress')}</span>
                              <span className="font-medium">{member.avgProgress}%</span>
                            </div>
                            <Progress value={member.avgProgress} className="h-1" />
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-3">
                      {/* Mobile stats row */}
                      <div className="sm:hidden grid grid-cols-4 gap-2 text-center mb-3 py-2 px-2 rounded-lg bg-muted/20">
                        <div>
                          <div className="text-sm font-bold">{member.active}</div>
                          <p className="text-[10px] text-muted-foreground">{t('tasks.stats.active')}</p>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-chart-1">{member.completed}</div>
                          <p className="text-[10px] text-muted-foreground">{t('tasks.stats.completed')}</p>
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${member.overdue > 0 ? 'text-destructive' : ''}`}>{member.overdue}</div>
                          <p className="text-[10px] text-muted-foreground">{t('tasks.stats.overdue')}</p>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-chart-5">{member.highPriority}</div>
                          <p className="text-[10px] text-muted-foreground">P1</p>
                        </div>
                      </div>

                      {memberTasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('teamWorkload.noTasksFound')}</p>
                      ) : (
                        <DataTable
                          columns={memberTaskColumns}
                          data={memberTasks}
                          rowKey={row => row.id}
                          isLoading={false}
                          emptyMessage={t('teamWorkload.noTasksFound')}
                          bordered={false}
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
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

      {user?.id && (
        <CreateTaskModal
          open={enterpriseModalOpen}
          onOpenChange={setEnterpriseModalOpen}
          employeeId={user.id}
        />
      )}
    </div>
  );
}
