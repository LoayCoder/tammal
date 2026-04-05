import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, ArrowRightLeft, GripVertical, User, Clock, AlertTriangle } from 'lucide-react';
import { useCapacityPlanner, type CapacityEmployee, type CapacityTask } from '../hooks/useCapacityPlanner';

function getUtilColor(pct: number) {
  if (pct > 100) return 'text-destructive';
  if (pct > 80) return 'text-chart-5';
  if (pct > 50) return 'text-chart-2';
  return 'text-muted-foreground';
}

function getBarColor(pct: number) {
  if (pct > 100) return '[&>div]:bg-destructive';
  if (pct > 80) return '[&>div]:bg-chart-5';
  return '[&>div]:bg-chart-2';
}

export function CapacityPlannerView() {
  const { t } = useTranslation();
  const { employees, isPending, reassignTask } = useCapacityPlanner();
  const [search, setSearch] = useState('');
  const [dragTask, setDragTask] = useState<CapacityTask | null>(null);
  const [reassignDialog, setReassignDialog] = useState<{
    task: CapacityTask;
    fromEmployee: string;
  } | null>(null);
  const [targetEmployee, setTargetEmployee] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(e =>
      e.name.toLowerCase().includes(q) || e.department?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  const handleDragStart = useCallback((task: CapacityTask, fromName: string) => {
    setDragTask(task);
    setReassignDialog(null);
  }, []);

  const handleDrop = useCallback((toEmployee: CapacityEmployee) => {
    if (!dragTask || dragTask.employeeId === toEmployee.id) {
      setDragTask(null);
      return;
    }
    const fromEmp = employees.find(e => e.id === dragTask.employeeId);
    setReassignDialog({
      task: dragTask,
      fromEmployee: fromEmp?.name ?? '',
    });
    setTargetEmployee(toEmployee.id);
    setDragTask(null);
  }, [dragTask, employees]);

  const confirmReassign = () => {
    if (!reassignDialog || !targetEmployee) return;
    reassignTask.mutate({ taskId: reassignDialog.task.id, toEmployeeId: targetEmployee });
    setReassignDialog(null);
    setTargetEmployee('');
  };

  const openManualReassign = (task: CapacityTask) => {
    const fromEmp = employees.find(e => e.id === task.employeeId);
    setReassignDialog({ task, fromEmployee: fromEmp?.name ?? '' });
    setTargetEmployee('');
  };

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('capacityPlanner.searchEmployees', 'Search employees...')}
          className="ps-9 h-9 border-border/50"
        />
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-xs gap-1">
          <User className="h-3 w-3" /> {employees.length} {t('capacityPlanner.totalMembers', 'team members')}
        </Badge>
        <Badge variant="destructive" className="text-xs gap-1">
          <AlertTriangle className="h-3 w-3" /> {employees.filter(e => e.utilizationPct > 100).length} {t('capacityPlanner.overloaded', 'overloaded')}
        </Badge>
        <Badge variant="secondary" className="text-xs gap-1">
          <Clock className="h-3 w-3" /> {employees.filter(e => e.utilizationPct < 30).length} {t('capacityPlanner.underutilized', 'underutilized')}
        </Badge>
      </div>

      {/* Employee capacity cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(emp => (
          <Card
            key={emp.id}
            className="border-0 shadow-sm transition-all hover:shadow-md"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary/50'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary/50'); }}
            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('ring-2', 'ring-primary/50'); handleDrop(emp); }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-sm truncate">{emp.name}</CardTitle>
                  {emp.department && (
                    <p className="text-xs text-muted-foreground truncate">{emp.department}</p>
                  )}
                </div>
                <span className={`text-lg font-bold tabular-nums ${getUtilColor(emp.utilizationPct)}`}>
                  {emp.utilizationPct}%
                </span>
              </div>
              <div className="space-y-1">
                <Progress value={Math.min(emp.utilizationPct, 100)} className={`h-2 ${getBarColor(emp.utilizationPct)}`} />
                <div className="flex justify-between text-2xs text-muted-foreground">
                  <span>{Math.round(emp.totalLoad / 60 * 10) / 10}h {t('capacityPlanner.loaded', 'loaded')}</span>
                  <span>{Math.round(emp.dailyCapacity / 60)}h {t('capacityPlanner.capacity', 'capacity')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {emp.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{t('capacityPlanner.noTasks', 'No active tasks')}</p>
              ) : (
                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                  {emp.tasks.slice(0, 8).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task, emp.name)}
                      className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 hover:bg-muted/50 cursor-grab active:cursor-grabbing group transition-colors min-h-[44px]"
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{task.title}</p>
                        <p className="text-2xs text-muted-foreground">{task.estimatedMinutes}m</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => openManualReassign(task)}
                      >
                        <ArrowRightLeft className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {emp.tasks.length > 8 && (
                    <p className="text-2xs text-muted-foreground text-center py-1">
                      +{emp.tasks.length - 8} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-0">
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('common.noData')}
          </CardContent>
        </Card>
      )}

      {/* Reassign dialog */}
      <Dialog open={!!reassignDialog} onOpenChange={(open) => !open && setReassignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('capacityPlanner.reassignTask', 'Reassign Task')}</DialogTitle>
            <DialogDescription>
              {t('capacityPlanner.reassignDesc', 'Move this task to another team member')}
            </DialogDescription>
          </DialogHeader>
          {reassignDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 space-y-1">
                <p className="text-sm font-medium">{reassignDialog.task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {t('capacityPlanner.from', 'From')}: {reassignDialog.fromEmployee}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('capacityPlanner.estimated', 'Estimated')}: {reassignDialog.task.estimatedMinutes}m
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('capacityPlanner.assignTo', 'Assign to')}</label>
                <Select value={targetEmployee} onValueChange={setTargetEmployee}>
                  <SelectTrigger><SelectValue placeholder={t('capacityPlanner.selectEmployee', 'Select employee...')} /></SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(e => e.id !== reassignDialog.task.employeeId)
                      .map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          <span className="flex items-center gap-2">
                            {e.name}
                            <span className={`text-xs ${getUtilColor(e.utilizationPct)}`}>({e.utilizationPct}%)</span>
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialog(null)}>{t('common.cancel')}</Button>
            <Button onClick={confirmReassign} disabled={!targetEmployee || reassignTask.isPending}>
              {t('capacityPlanner.confirm', 'Reassign')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
