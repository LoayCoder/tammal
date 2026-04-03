import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Eye, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyState } from '@/shared/empty/EmptyState';
import { useApprovalQueue } from '@/features/tasks/hooks/useApprovalQueue';

export function WorkloadApprovalsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pendingTasks, tasksLoading, updateStatus } = useApprovalQueue();

  const handleApprove = (id: string) => updateStatus.mutate({ id, status: 'completed' });
  const handleReject = (id: string) => updateStatus.mutate({ id, status: 'rejected' });

  if (tasksLoading) return <Skeleton className="h-64" />;

  if (pendingTasks.length === 0) {
    return <EmptyState title={t('tasks.approvalEmpty')} description={t('tasks.approvalEmptyDesc')} />;
  }

  return (
    <div className="space-y-3">
      {pendingTasks.map(task => (
        <Card key={task.id} className="border-0 bg-muted/20 hover:bg-muted/40 transition-colors">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{task.title}</span>
                  <Badge variant="outline" className={task.status === 'pending_approval' ? 'bg-chart-5/10 text-chart-5' : 'bg-chart-4/10 text-chart-4'}>
                    {t(`tasks.status.${task.status}`)}
                  </Badge>
                  <Badge variant="outline">P{task.priority}</Badge>
                </div>
                {(task as any).employee?.full_name && (
                  <p className="text-xs text-muted-foreground">{t('tasks.fields.assignee')}: {(task as any).employee.full_name}</p>
                )}
                {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.due_date && (
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(new Date(task.due_date), 'PP')}</span>
                  )}
                  <span>{t('tasks.fields.progress')}: {task.progress}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.id}`)} className="gap-1">
                  <Eye className="h-3.5 w-3.5" />{t('common.view')}
                </Button>
                <Button size="sm" variant="default" onClick={() => handleApprove(task.id)} className="gap-1" disabled={updateStatus.isPending}>
                  <CheckCircle2 className="h-3.5 w-3.5" />{t('tasks.approve')}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleReject(task.id)} className="gap-1" disabled={updateStatus.isPending}>
                  <XCircle className="h-3.5 w-3.5" />{t('tasks.reject')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
