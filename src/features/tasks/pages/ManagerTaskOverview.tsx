import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Users, AlertTriangle, CheckCircle2, Clock, Search, Eye,
  TrendingUp, Flame, ListChecks,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/shared/empty/EmptyState';
import { differenceInDays } from 'date-fns';
import { useManagerTaskOverview } from '@/features/tasks/hooks/useManagerTaskOverview';

interface TaskSummary {
  employeeId: string;
  employeeName: string;
  roleTitle: string | null;
  total: number;
  active: number;
  completed: number;
  overdue: number;
  avgProgress: number;
  highPriority: number;
}

export default function ManagerTaskOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { directReports, allTasks, empLoading, reportsLoading, tasksLoading, employee } = useManagerTaskOverview();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'overdue' | 'active' | 'progress'>('overdue');

  const now = new Date();
  const summaries = useMemo<TaskSummary[]>(() => {
    return directReports.map(emp => {
      const empTasks = allTasks.filter(t => t.employee_id === emp.id);
      const active = empTasks.filter(t => !['completed', 'archived', 'rejected'].includes(t.status));
      const completed = empTasks.filter(t => t.status === 'completed');
      const overdue = active.filter(t => t.due_date && new Date(t.due_date) < now);
      const highPriority = active.filter(t => t.priority <= 1);
      const avgProgress = active.length > 0
        ? Math.round(active.reduce((sum, t) => sum + (t.progress ?? 0), 0) / active.length)
        : 0;

      return {
        employeeId: emp.id,
        employeeName: emp.full_name,
        roleTitle: emp.role_title,
        total: empTasks.length,
        active: active.length,
        completed: completed.length,
        overdue: overdue.length,
        avgProgress,
        highPriority: highPriority.length,
      };
    });
  }, [directReports, allTasks, now]);

  const filtered = useMemo(() => {
    let result = summaries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.employeeName.toLowerCase().includes(q));
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'overdue': return b.overdue - a.overdue;
        case 'active': return b.active - a.active;
        case 'progress': return a.avgProgress - b.avgProgress;
        default: return a.employeeName.localeCompare(b.employeeName);
      }
    });
    return result;
  }, [summaries, search, sortBy]);

  // Aggregate stats
  const totals = useMemo(() => ({
    members: directReports.length,
    totalTasks: allTasks.length,
    activeTasks: allTasks.filter(t => !['completed', 'archived', 'rejected'].includes(t.status)).length,
    overdueTasks: allTasks.filter(t => {
      const isActive = !['completed', 'archived', 'rejected'].includes(t.status);
      return isActive && t.due_date && new Date(t.due_date) < now;
    }).length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
  }), [directReports, allTasks, now]);

  const isLoading = empLoading || reportsLoading || tasksLoading;

  if (empLoading) {
    return <div className="space-y-4 p-2"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground py-20">{t('commandCenter.noProfile')}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('tasks.managerOverview.title')}</h1>
        <p className="text-muted-foreground text-sm">{t('tasks.managerOverview.description')}</p>
      </div>

      {/* Aggregate Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-xl font-bold">{totals.members}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.managerOverview.teamMembers')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <ListChecks className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
          <div className="text-xl font-bold">{totals.activeTasks}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.active')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-chart-1" />
          <div className="text-xl font-bold text-chart-1">{totals.completedTasks}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.completed')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-destructive" />
          <div className="text-xl font-bold text-destructive">{totals.overdueTasks}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.overdue')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
          <div className="text-xl font-bold text-primary">{totals.totalTasks}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.managerOverview.totalTasks')}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

      {/* Team member cards */}
      {isLoading ? <Skeleton className="h-64" /> : filtered.length === 0 ? (
        <EmptyState
          title={t('tasks.managerOverview.noReports')}
          description={t('tasks.managerOverview.noReportsDesc')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(member => {
            const overdueRatio = member.active > 0 ? member.overdue / member.active : 0;
            const riskLevel = overdueRatio > 0.5 ? 'high' : overdueRatio > 0.25 ? 'medium' : 'low';

            return (
              <Card key={member.employeeId} className="border-0 bg-muted/20 hover:bg-muted/40 transition-colors">
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{member.employeeName}</h3>
                      {member.roleTitle && (
                        <p className="text-xs text-muted-foreground">{member.roleTitle}</p>
                      )}
                    </div>
                    {riskLevel === 'high' && (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <Flame className="h-3 w-3" />{t('tasks.managerOverview.atRisk')}
                      </Badge>
                    )}
                    {riskLevel === 'medium' && (
                      <Badge className="bg-chart-5/10 text-chart-5 gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />{t('tasks.managerOverview.warning')}
                      </Badge>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2 text-center">
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
                      <p className="text-[10px] text-muted-foreground">{t('tasks.managerOverview.highPri')}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('tasks.managerOverview.avgProgress')}</span>
                      <span className="font-medium">{member.avgProgress}%</span>
                    </div>
                    <Progress value={member.avgProgress} className="h-1.5" />
                  </div>

                  {/* View button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-1.5 text-xs"
                    onClick={() => navigate(`/my-tasks?employee=${member.employeeId}`)}
                  >
                    <Eye className="h-3.5 w-3.5" />{t('tasks.managerOverview.viewTasks')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
