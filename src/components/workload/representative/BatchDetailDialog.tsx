import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CheckCircle2, Clock, AlertTriangle, CircleDot, MoreHorizontal, Pencil, Trash2, CalendarClock } from 'lucide-react';
import { useRepresentativeTasks } from '@/features/workload';
import { EditTaskDialog } from './EditTaskDialog';
import { DeleteTaskDialog } from './DeleteTaskDialog';
import { ExtendDueDateDialog } from './ExtendDueDateDialog';
import type { ManageTaskPayload } from '@/features/workload/hooks/useRepresentativeTasks';

interface BatchDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  batchTitle: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  done: { icon: CheckCircle2, variant: 'default' },
  in_progress: { icon: Clock, variant: 'secondary' },
  blocked: { icon: AlertTriangle, variant: 'destructive' },
  todo: { icon: CircleDot, variant: 'outline' },
};

export function BatchDetailDialog({ open, onOpenChange, batchId, batchTitle }: BatchDetailDialogProps) {
  const { t } = useTranslation();
  const { useBatchDetail, manageTask, isManaging } = useRepresentativeTasks();
  const { data: tasks = [], isPending } = useBatchDetail(open ? batchId : null);

  // Sub-dialog state
  const [editTask, setEditTask] = useState<typeof tasks[0] | null>(null);
  const [deleteTask, setDeleteTask] = useState<{ id: string; title: string } | null>(null);
  const [extendTask, setExtendTask] = useState<typeof tasks[0] | null>(null);

  const counts = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  const handleManage = async (payload: ManageTaskPayload) => {
    await manageTask(payload);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{batchTitle}</DialogTitle>
          </DialogHeader>

          {/* Summary */}
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge variant="outline">{t('representative.matrixTotal')}: {counts.total}</Badge>
            <Badge variant="default">{t('representative.matrixDone')}: {counts.done}</Badge>
            <Badge variant="secondary">{t('representative.matrixInProgress')}: {counts.in_progress}</Badge>
            {counts.blocked > 0 && <Badge variant="destructive">{t('representative.matrixBlocked')}: {counts.blocked}</Badge>}
            <Badge variant="outline">{t('representative.matrixTodo')}: {counts.todo}</Badge>
          </div>

          {isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-start px-3 py-2 font-medium">{t('representative.employee')}</th>
                    <th className="text-start px-3 py-2 font-medium">{t('common.status')}</th>
                    <th className="text-start px-3 py-2 font-medium">{t('representative.dueDate')}</th>
                    <th className="text-start px-3 py-2 font-medium">{t('representative.lastUpdated')}</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
                    const Icon = cfg.icon;
                    const hasExtensions = task.due_date_history && task.due_date_history.length > 0;
                    return (
                      <tr key={task.id} className="border-t">
                        <td className="px-3 py-2">{task.employee_name}</td>
                        <td className="px-3 py-2">
                          <Badge variant={cfg.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {t(`workload.statuses.${task.status}`, task.status)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-1">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                            {hasExtensions && (
                              <Badge variant="outline" className="text-2xs px-1 py-0">
                                +{task.due_date_history.length}
                              </Badge>
                            )}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditTask(task)}>
                                <Pencil className="h-3.5 w-3.5 me-2" />
                                {t('representative.editTask')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExtendTask(task)}>
                                <CalendarClock className="h-3.5 w-3.5 me-2" />
                                {t('representative.extendDueDate')}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTask({ id: task.id, title: task.title })}>
                                <Trash2 className="h-3.5 w-3.5 me-2" />
                                {t('representative.deleteTask')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditTaskDialog
        open={!!editTask}
        onOpenChange={(o) => { if (!o) setEditTask(null); }}
        task={editTask}
        onSubmit={handleManage}
        isSubmitting={isManaging}
      />

      <DeleteTaskDialog
        open={!!deleteTask}
        onOpenChange={(o) => { if (!o) setDeleteTask(null); }}
        taskId={deleteTask?.id ?? null}
        taskTitle={deleteTask?.title ?? ''}
        onSubmit={handleManage}
        isSubmitting={isManaging}
      />

      <ExtendDueDateDialog
        open={!!extendTask}
        onOpenChange={(o) => { if (!o) setExtendTask(null); }}
        taskId={extendTask?.id ?? null}
        taskTitle={extendTask?.title ?? ''}
        currentDueDate={extendTask?.due_date ?? null}
        dueDateHistory={extendTask?.due_date_history ?? []}
        onSubmit={handleManage}
        isSubmitting={isManaging}
      />
    </>
  );
}
