import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Plus, ListChecks, CalendarDays, CheckCircle2, AlertTriangle, Flame, CheckSquare, ChevronDown, Star,
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
  const [capacityOpen, setCapacityOpen] = useState(true);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const active = tasks.filter(t => !['completed', 'verified', 'archived'].includes(t.status));
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'verified');
    const overdue = active.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr);
    const scheduledMinutes = active.reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);
    return { active, completed, overdue, scheduledMinutes };
  }, [tasks]);

  if (empLoading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground py-20">{t('commandCenter.noProfile')}</div>;
  }

  const pendingCount = pendingTasks?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('commandCenter.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('commandCenter.pageDesc')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3 text-chart-1" />{totalPoints} {t('home.points')}</Badge>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />{t('commandCenter.addTask')}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><ListChecks className="h-4 w-4 text-primary" /></div>
            <div><div className="text-lg font-bold">{stats.active.length}</div><p className="text-muted-foreground text-xs">{t('commandCenter.activeTasks')}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-1/10"><CheckCircle2 className="h-4 w-4 text-chart-1" /></div>
            <div><div className="text-lg font-bold">{stats.completed.length}</div><p className="text-muted-foreground text-xs">{t('commandCenter.completed')}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
            <div><div className="text-lg font-bold">{stats.overdue.length}</div><p className="text-muted-foreground text-xs">{t('commandCenter.overdue')}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-5/10"><CheckSquare className="h-4 w-4 text-chart-5" /></div>
            <div><div className="text-lg font-bold">{pendingCount}</div><p className="text-muted-foreground text-xs">{t('workload.views.approvals')}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-muted/30">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10"><Flame className="h-4 w-4 text-chart-4" /></div>
            <div><div className="text-lg font-bold">{streak}</div><p className="text-muted-foreground text-xs">{t('commandCenter.streak')}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Gauge (Collapsible) */}
      <Collapsible open={capacityOpen} onOpenChange={setCapacityOpen}>
        <Card className="border-0 bg-muted/30">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 text-sm font-medium text-start hover:bg-muted/20 rounded-lg transition-colors">
              {t('commandCenter.capacity')}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${capacityOpen ? 'rotate-180' : ''}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4">
              <CapacityGauge scheduledMinutes={stats.scheduledMinutes} />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
              <Badge className="h-4 min-w-[16px] px-1 text-[10px] absolute -top-1.5 -end-1.5">{pendingCount}</Badge>
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
