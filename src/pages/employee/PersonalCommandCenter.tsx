import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useUnifiedTasks } from '@/features/workload';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useApprovalQueue } from '@/features/tasks/hooks/useApprovalQueue';
import { CapacityGauge } from '@/components/workload/employee/CapacityGauge';
import { WorkloadTasksView } from '@/features/workload/components/WorkloadTasksView';
import { WorkloadCalendarView } from '@/features/workload/components/WorkloadCalendarView';
import { WorkloadApprovalsView } from '@/features/workload/components/WorkloadApprovalsView';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import PageHeader from '@/components/system/PageHeader';
import {
  Plus, ListChecks, CalendarDays, CheckCircle2, AlertTriangle, Flame, CheckSquare, Star, LayoutDashboard,
} from 'lucide-react';

type ViewType = 'tasks' | 'calendar' | 'approvals';

export default function PersonalCommandCenter() {
  const { t } = useTranslation();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { tasks, isPending: tasksLoading, deleteTask } = useUnifiedTasks(employee?.id);
  const { streak, totalPoints } = useGamification(employee?.id ?? null);
  const { pendingTasks } = useApprovalQueue();

  const [view, setView] = useState<ViewType>('tasks');
  const [createOpen, setCreateOpen] = useState(false);

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
      <div className="space-y-5 p-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-20" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground py-20">{t('commandCenter.noProfile')}</div>;
  }

  const pendingCount = pendingTasks?.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title={t('commandCenter.pageTitle')}
        subtitle={t('commandCenter.pageDesc')}
        variant="card"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 text-chart-1" />{totalPoints} {t('home.points')}
            </Badge>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />{t('commandCenter.addTask')}
            </Button>
          </div>
        }
      />

      {/* Stats Row — single premium panel with dividers */}
      <div className="premium-card">
        <div className="flex items-center divide-x divide-border/30 overflow-x-auto">
          {[
            { icon: ListChecks, color: 'text-primary', value: stats.active.length, label: t('commandCenter.activeTasks') },
            { icon: CheckCircle2, color: 'text-chart-1', value: stats.completed.length, label: t('commandCenter.completed') },
            { icon: AlertTriangle, color: 'text-destructive', value: stats.overdue.length, label: t('commandCenter.overdue') },
            { icon: CheckSquare, color: 'text-chart-5', value: pendingCount, label: t('workload.views.approvals') },
            { icon: Flame, color: 'text-chart-4', value: streak, label: t('commandCenter.streak') },
          ].map((stat, i) => (
            <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1 py-4 px-3">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-lg font-bold">{stat.value}</span>
              <span className="text-2xs text-muted-foreground text-center whitespace-nowrap">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity Gauge — always visible */}
      <div className="premium-card p-4">
        <CapacityGauge scheduledMinutes={stats.scheduledMinutes} />
      </div>

      {/* View Switcher */}
      <div className="flex items-center justify-center">
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => { if (v) setView(v as ViewType); }}
          className="bg-muted/30 p-1 rounded-lg"
        >
          <ToggleGroupItem value="tasks" className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm px-4">
            <ListChecks className="h-3.5 w-3.5" />{t('workload.views.tasks')}
          </ToggleGroupItem>
          <ToggleGroupItem value="calendar" className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm px-4">
            <CalendarDays className="h-3.5 w-3.5" />{t('workload.views.calendar')}
          </ToggleGroupItem>
          <ToggleGroupItem value="approvals" className="gap-1.5 text-xs data-[state=on]:bg-background data-[state=on]:shadow-sm px-4 relative">
            <CheckSquare className="h-3.5 w-3.5" />{t('workload.views.approvals')}
            {pendingCount > 0 && (
              <Badge className="h-4 min-w-[16px] px-1 text-2xs absolute -top-1.5 -end-1.5">{pendingCount}</Badge>
            )}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Active View */}
      {view === 'tasks' && (
        <WorkloadTasksView tasks={tasks} isPending={tasksLoading} onDelete={deleteTask} />
      )}
      {view === 'calendar' && (
        <WorkloadCalendarView tasks={tasks} isPending={tasksLoading} />
      )}
      {view === 'approvals' && (
        <WorkloadApprovalsView />
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
