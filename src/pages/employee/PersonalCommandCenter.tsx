import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useUnifiedTasks, usePersonalTodos } from '@/features/workload';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useApprovalQueue } from '@/features/tasks/hooks/useApprovalQueue';
import { CapacityGauge } from '@/components/workload/employee/CapacityGauge';
import { WorkloadTasksView } from '@/features/workload/components/WorkloadTasksView';
import { WorkloadCalendarView } from '@/features/workload/components/WorkloadCalendarView';
import { WorkloadApprovalsView } from '@/features/workload/components/WorkloadApprovalsView';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { typography } from '@/theme/tokens';
import { VipTodoView } from '@/features/workload/components/VipTodoView';
import {
  Plus, ListChecks, CalendarDays, CheckCircle2, AlertTriangle, Flame, CheckSquare, Star, Sparkles,
} from 'lucide-react';

type ViewType = 'tasks' | 'calendar' | 'approvals' | 'todo';

export default function PersonalCommandCenter() {
  const { t } = useTranslation();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { tasks, isPending: tasksLoading, deleteTask } = useUnifiedTasks(employee?.id);
  const { streak, totalPoints } = useGamification(employee?.id ?? null);
  const { pendingTasks } = useApprovalQueue();
  const { todos: personalTodos } = usePersonalTodos(employee?.id);

  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as ViewType) || 'tasks';
  const [view, setView] = useState<ViewType>(initialTab);
  const [createOpen, setCreateOpen] = useState(false);

  // Sync tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab') as ViewType;
    if (tab && ['tasks', 'calendar', 'approvals', 'todo'].includes(tab)) {
      setView(tab);
    }
  }, [searchParams]);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const active = tasks.filter(t => !['completed', 'archived'].includes(t.status));
    const completed = tasks.filter(t => t.status === 'completed');
    const overdue = active.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr);
    const scheduledMinutes = active.reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);
    return { active, completed, overdue, scheduledMinutes };
  }, [tasks]);

  if (empLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground py-20">{t('commandCenter.noProfile')}</div>;
  }

  const pendingCount = pendingTasks?.length ?? 0;

  const statItems = [
    { icon: ListChecks, value: stats.active.length, label: t('commandCenter.activeTasks'), color: 'text-primary' },
    { icon: CheckCircle2, value: stats.completed.length, label: t('commandCenter.completed'), color: 'text-chart-1' },
    { icon: AlertTriangle, value: stats.overdue.length, label: t('commandCenter.overdue'), color: 'text-destructive' },
    { icon: CheckSquare, value: pendingCount, label: t('workload.views.approvals'), color: 'text-chart-5' },
    { icon: Flame, value: streak, label: t('commandCenter.streak'), color: 'text-chart-4' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className={typography.greeting}>{t('commandCenter.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('commandCenter.pageDesc')}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-chart-4" />
            <span className="font-semibold text-foreground">{totalPoints}</span>
            <span>{t('home.points')}</span>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5 rounded-lg">
            <Plus className="h-3.5 w-3.5" />{t('commandCenter.addTask')}
          </Button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-px rounded-xl bg-border/40 overflow-hidden">
        {statItems.map((s, i) => (
          <div
            key={i}
            className="bg-background flex flex-col items-center justify-center py-3 sm:py-4 px-2 transition-colors hover:bg-muted/10 min-h-[44px] active:scale-[0.97]"
          >
            <s.icon className={`h-4 w-4 ${s.color} mb-1`} strokeWidth={1.75} />
            <span className="text-lg sm:text-xl font-bold tracking-tight">{s.value}</span>
            <span className="text-2xs text-muted-foreground mt-0.5 text-center leading-tight">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Capacity ── */}
      <div className="px-1">
        <CapacityGauge scheduledMinutes={stats.scheduledMinutes} />
      </div>

      {/* ── View Switcher ── */}
      <div className="flex items-center justify-center overflow-x-auto no-scrollbar">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => { if (v) setView(v as ViewType); }}
          className="bg-muted/15 p-1 rounded-xl border border-border/50 whitespace-nowrap"
        >
          <ToggleGroupItem value="tasks" className="gap-1.5 text-xs rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 sm:px-5 min-h-[44px] shrink-0 transition-all duration-200">
            <ListChecks className="h-3.5 w-3.5" />{t('workload.views.tasks')}
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" className="gap-1.5 text-xs rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 sm:px-5 min-h-[44px] shrink-0 transition-all duration-200">
            <CalendarDays className="h-3.5 w-3.5" />{t('workload.views.calendar')}
          </ToggleGroupItem>
          <ToggleGroupItem value="approvals" className="gap-1.5 text-xs rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 sm:px-5 min-h-[44px] shrink-0 relative transition-all duration-200">
            <CheckSquare className="h-3.5 w-3.5" />{t('workload.views.approvals')}
            {pendingCount > 0 && (
              <Badge className="h-4 min-w-[16px] px-1 text-2xs absolute -top-1.5 -end-1.5">{pendingCount}</Badge>
            )}
          </ToggleGroupItem>
          <ToggleGroupItem value="todo" className="gap-1.5 text-xs rounded-lg data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 sm:px-5 min-h-[44px] shrink-0 transition-all duration-200">
            <Sparkles className="h-3.5 w-3.5" />{t('workload.views.todo', 'To-Do')}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* ── Active View ── */}
      {view === 'tasks' && (
        <WorkloadTasksView tasks={tasks} isPending={tasksLoading} onDelete={deleteTask} />
      )}
      {view === 'calendar' && (
        <WorkloadCalendarView tasks={tasks} isPending={tasksLoading} todos={personalTodos} />
      )}
      {view === 'approvals' && (
        <WorkloadApprovalsView />
      )}
      {view === 'todo' && (
        <VipTodoView
          employeeId={employee.id}
          employeeName={employee.full_name}
          tenantId={employee.tenant_id}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        employeeId={employee.id}
        employeeName={employee.full_name}
        defaultDepartmentId={null}
      />
    </div>
  );
}
