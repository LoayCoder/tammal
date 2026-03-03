import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, AlertTriangle, CircleDot } from 'lucide-react';
import { useRepresentativeTasks } from '@/hooks/workload/useRepresentativeTasks';

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
  const { useBatchDetail } = useRepresentativeTasks();
  const { data: tasks = [], isPending } = useBatchDetail(open ? batchId : null);

  const counts = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
                  <th className="text-start px-3 py-2 font-medium">{t('representative.lastUpdated')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
                  const Icon = cfg.icon;
                  return (
                    <tr key={task.id} className="border-t">
                      <td className="px-3 py-2">{task.employee_name}</td>
                      <td className="px-3 py-2">
                        <Badge variant={cfg.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {t(`workload.statuses.${task.status}`, task.status)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {task.updated_at ? new Date(task.updated_at).toLocaleDateString() : '—'}
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
  );
}
