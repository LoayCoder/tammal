import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, Eye, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/shared/empty/EmptyState';
import { useApprovalQueue } from '@/features/tasks/hooks/useApprovalQueue';

export default function ApprovalQueue() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pendingTasks, tasksLoading, empLoading, updateStatus } = useApprovalQueue();

  const handleApprove = (id: string) => updateStatus.mutate({ id, status: 'completed' });
  const handleReject = (id: string) => updateStatus.mutate({ id, status: 'rejected' });

  if (empLoading) return <div className="p-2"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 mt-4" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('tasks.approvalQueue')}</h1>
        <p className="text-muted-foreground text-sm">{t('tasks.approvalQueueDesc')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />{pendingTasks.length} {t('tasks.pending')}</Badge>
      </div>

      {tasksLoading ? <Skeleton className="h-64" /> : pendingTasks.length === 0 ? (
        <EmptyState title={t('tasks.approvalEmpty')} description={t('tasks.approvalEmptyDesc')} />
      ) : (
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
                    {(task as any).employee?.full_name && <p className="text-xs text-muted-foreground">{t('tasks.fields.assignee')}: {(task as any).employee.full_name}</p>}
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
      )}
    </div>
  );
}
