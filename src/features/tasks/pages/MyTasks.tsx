import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useUnifiedTasks } from '@/features/workload';
import { UnifiedTaskList } from '@/components/workload/employee/UnifiedTaskList';
import { TaskDialog } from '@/components/workload/employee/TaskDialog';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import {
  Plus, Search, ListChecks, CalendarDays, CheckCircle2, AlertTriangle,
  Clock, Filter,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUSES = ['all', 'draft', 'open', 'in_progress', 'under_review', 'pending_approval', 'completed', 'rejected', 'archived'] as const;
const PRIORITY_OPTIONS = [
  { value: 'all', labelKey: '' },
  { value: '0', labelKey: 'tasks.priority.critical' },
  { value: '1', labelKey: 'tasks.priority.high' },
  { value: '2', labelKey: 'tasks.priority.medium' },
  { value: '3', labelKey: 'tasks.priority.low' },
];

export default function MyTasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { tasks, isPending: tasksLoading, createTask, updateTask, deleteTask, addComment, isCreating, isUpdating } = useUnifiedTasks(employee?.id);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tab, setTab] = useState('active');

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let result = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => String(t.priority) === priorityFilter);
    return result;
  }, [tasks, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const active = filtered.filter(t => !['completed', 'archived'].includes(t.status));
    const completed = filtered.filter(t => t.status === 'completed');
    const overdue = active.filter(t => t.due_date && t.due_date.split('T')[0] < todayStr);
    const pendingApproval = filtered.filter(t => t.status === 'pending_approval' || t.status === 'under_review');
    return { active, completed, overdue, pendingApproval };
  }, [filtered, todayStr]);

  const handleEdit = (task: any) => {
    navigate(`/tasks/${task.id}`);
  };
  const handleQuickEdit = (task: any) => { setEditingTask(task); setDialogOpen(true); };

  if (empLoading) {
    return <div className="space-y-4 p-2"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  }

  if (!employee) {
    return <div className="text-center text-muted-foreground py-20">{t('commandCenter.noProfile')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('tasks.myTasks')}</h1>
          <p className="text-muted-foreground text-sm">{t('tasks.myTasksDesc')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />{t('tasks.createTask')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold">{stats.active.length}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.active')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-chart-1">{stats.completed.length}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.completed')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-destructive">{stats.overdue.length}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.overdue')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-muted/30"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-chart-4">{stats.pendingApproval.length}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.pendingReview')}</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tasks.searchPlaceholder')}
            className="ps-9 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s === 'all' ? t('common.allStatuses') : t(`tasks.status.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.value === 'all' ? t('common.allPriorities') : t(p.labelKey)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task tabs */}
      <Card className="border-0">
        <CardContent className="p-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active" className="gap-1.5 text-xs"><ListChecks className="h-3.5 w-3.5" />{t('tasks.tabs.active')} ({stats.active.length})</TabsTrigger>
              <TabsTrigger value="overdue" className="gap-1.5 text-xs"><AlertTriangle className="h-3.5 w-3.5" />{t('tasks.tabs.overdue')} ({stats.overdue.length})</TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />{t('tasks.tabs.completed')} ({stats.completed.length})</TabsTrigger>
            </TabsList>
            {(['active', 'overdue', 'completed'] as const).map(key => (
              <TabsContent key={key} value={key}>
                {tasksLoading ? <Skeleton className="h-40" /> : (
                  <UnifiedTaskList
                    tasks={stats[key === 'active' ? 'active' : key === 'overdue' ? 'overdue' : key]}
                    onEdit={handleEdit}
                    onDelete={deleteTask}
                  />
                )}
              </TabsContent>
            ))}
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
