import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { AlertTriangle, CalendarDays, Clock, Eye, Flame } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/shared/empty/EmptyState';

function getEscalationLevel(daysOverdue: number): { level: number; className: string; label: string } {
  if (daysOverdue >= 14) return { level: 3, className: 'bg-destructive text-destructive-foreground', label: 'Level 3' };
  if (daysOverdue >= 7) return { level: 2, className: 'bg-chart-5/10 text-chart-5', label: 'Level 2' };
  if (daysOverdue >= 3) return { level: 1, className: 'bg-chart-4/10 text-chart-4', label: 'Level 1' };
  return { level: 0, className: 'bg-muted text-muted-foreground', label: 'Minor' };
}

export default function OverdueTasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tenantId } = useTenantId();
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: overdueTasks = [], isPending } = useQuery({
    queryKey: ['overdue-tasks', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_tasks')
        .select('*')
        .eq('tenant_id', tenantId!)
        .is('deleted_at', null)
        .eq('archived', false)
        .not('status', 'in', '("completed","verified","archived","rejected")')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const stats = useMemo(() => {
    const level1 = overdueTasks.filter(t => { const d = differenceInDays(new Date(), new Date(t.due_date)); return d >= 3 && d < 7; }).length;
    const level2 = overdueTasks.filter(t => { const d = differenceInDays(new Date(), new Date(t.due_date)); return d >= 7 && d < 14; }).length;
    const level3 = overdueTasks.filter(t => differenceInDays(new Date(), new Date(t.due_date)) >= 14).length;
    return { total: overdueTasks.length, level1, level2, level3 };
  }, [overdueTasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('tasks.overdueTasks')}</h1>
        <p className="text-muted-foreground text-sm">{t('tasks.overdueTasksDesc')}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card className="border-0 bg-destructive/5"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-destructive">{stats.total}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.stats.totalOverdue')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-chart-4/5"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-chart-4">{stats.level1}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.escalation.level1')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-chart-5/5"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-chart-5">{stats.level2}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.escalation.level2')}</p>
        </CardContent></Card>
        <Card className="border-0 bg-destructive/5"><CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-destructive">{stats.level3}</div>
          <p className="text-xs text-muted-foreground">{t('tasks.escalation.level3')}</p>
        </CardContent></Card>
      </div>

      {isPending ? <Skeleton className="h-64" /> : overdueTasks.length === 0 ? (
        <EmptyState title={t('tasks.noOverdue')} description={t('tasks.noOverdueDesc')} />
      ) : (
        <div className="space-y-3">
          {overdueTasks.map(task => {
            const daysOverdue = differenceInDays(new Date(), new Date(task.due_date));
            const escalation = getEscalationLevel(daysOverdue);
            return (
              <Card key={task.id} className="border-0 bg-muted/20 hover:bg-muted/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{task.title}</span>
                        <Badge className={escalation.className}>{escalation.label}</Badge>
                        <Badge variant="outline" className="text-destructive">{daysOverdue}d {t('tasks.overdue')}</Badge>
                        <Badge variant="outline">P{task.priority}</Badge>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{t('tasks.fields.dueDate')}: {format(new Date(task.due_date), 'PP')}</span>
                        <span>{t('tasks.fields.progress')}: {task.progress}%</span>
                        <span>{t('tasks.fields.status')}: {t(`tasks.status.${task.status}`)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/tasks/${task.id}`)} className="gap-1 shrink-0">
                      <Eye className="h-3.5 w-3.5" />{t('common.view')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
