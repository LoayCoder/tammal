import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useUnifiedTasks } from '@/hooks/workload/useUnifiedTasks';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { CapacityGauge } from '@/components/workload/employee/CapacityGauge';
import { UnifiedTaskList } from '@/components/workload/employee/UnifiedTaskList';
import { TaskDialog } from '@/components/workload/employee/TaskDialog';
import {
  Plus, ListChecks, CalendarDays, CheckCircle2, AlertTriangle, Flame, Star,
} from 'lucide-react';

export default function PersonalCommandCenter() {
  const { t } = useTranslation();
  const { employee, isLoading: empLoading } = useCurrentEmployee();
  const { tasks, isLoading: tasksLoading, createTask, updateTask, deleteTask, addComment, isCreating, isUpdating } = useUnifiedTasks(employee?.id);
  const { streak, totalPoints } = useGamification(employee?.id ?? null);
  const { avgMood7d } = useMoodHistory(employee?.id ?? null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [tab, setTab] = useState('today');

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const active = tasks.filter(t => t.status !== 'done');
    const done = tasks.filter(t => t.status === 'done');
    const overdue = active.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr);
    const scheduledMinutes = active.reduce((sum, t) => sum + (t.estimated_minutes ?? 0), 0);
    return { active, done, overdue, scheduledMinutes, total: tasks.length };
  }, [tasks]);

  const handleToggle = (task: any) => {
    updateTask({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' });
  };

  const handleEdit = (task: any) => { setEditingTask(task); setDialogOpen(true); };
  const handleAdd = () => { setEditingTask(null); setDialogOpen(true); };
  const handleStatusChange = (task: any, status: string) => { updateTask({ id: task.id, status }); };
  const handleComment = (task: any) => { setEditingTask(task); setDialogOpen(true); };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('commandCenter.pageTitle')}</h1>
          <p className="text-muted-foreground text-sm">{t('commandCenter.pageDesc')}</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />{t('commandCenter.addTask')}
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="glass-stat border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><ListChecks className="h-5 w-5 text-primary" /></div>
            <div><div className="text-xl font-bold">{stats.active.length}</div><p className="text-muted-foreground text-xs">{t('commandCenter.activeTasks')}</p></div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10"><CheckCircle2 className="h-5 w-5 text-chart-1" /></div>
            <div><div className="text-xl font-bold">{stats.done.length}</div><p className="text-muted-foreground text-xs">{t('commandCenter.completed')}</p></div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><div className="text-xl font-bold">{stats.overdue.length}</div><p className="text-muted-foreground text-xs">{t('commandCenter.overdue')}</p></div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10"><Flame className="h-5 w-5 text-chart-4" /></div>
            <div><div className="text-xl font-bold">{streak}</div><p className="text-muted-foreground text-xs">{t('commandCenter.streak')}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-0">
        <CardContent className="p-5"><CapacityGauge scheduledMinutes={stats.scheduledMinutes} /></CardContent>
      </Card>

      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t('commandCenter.taskList')}</CardTitle>
            <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3 text-chart-1" />{totalPoints} {t('home.points')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="today" className="gap-1.5 text-xs"><CalendarDays className="h-3.5 w-3.5" />{t('commandCenter.myDay')}</TabsTrigger>
              <TabsTrigger value="all" className="gap-1.5 text-xs"><ListChecks className="h-3.5 w-3.5" />{t('commandCenter.allTasks')}</TabsTrigger>
              <TabsTrigger value="done" className="gap-1.5 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />{t('commandCenter.completedTab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              {tasksLoading ? <Skeleton className="h-40" /> : (
                <UnifiedTaskList tasks={stats.active} onEdit={handleEdit} onDelete={deleteTask} onToggle={handleToggle} onStatusChange={handleStatusChange} onComment={handleComment} />
              )}
            </TabsContent>
            <TabsContent value="all">
              {tasksLoading ? <Skeleton className="h-40" /> : (
                <UnifiedTaskList tasks={tasks} onEdit={handleEdit} onDelete={deleteTask} onToggle={handleToggle} onStatusChange={handleStatusChange} onComment={handleComment} />
              )}
            </TabsContent>
            <TabsContent value="done">
              {tasksLoading ? <Skeleton className="h-40" /> : (
                <UnifiedTaskList tasks={stats.done} onEdit={handleEdit} onDelete={deleteTask} onToggle={handleToggle} onStatusChange={handleStatusChange} onComment={handleComment} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        employeeId={employee.id}
        tenantId={employee.tenant_id}
        onCreate={createTask}
        onUpdate={updateTask}
        isSubmitting={isCreating || isUpdating}
        onAddComment={addComment}
        currentEmployeeName={employee.full_name}
      />
    </div>
  );
}
