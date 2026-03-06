import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { isAfter, isBefore, format, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedTasks } from '@/features/workload/hooks/useUnifiedTasks';
import { useApprovalQueue } from '@/features/tasks/hooks/useApprovalQueue';
import {
  ClipboardList, ChevronRight, CheckCircle2, AlertTriangle,
  Clock, SquareCheckBig,
} from 'lucide-react';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-destructive',     // critical
  2: 'bg-chart-4',         // high
  3: 'bg-chart-2',         // medium
  4: 'bg-chart-1',         // low
};

interface Props {
  employeeId: string;
}

export function DashboardWorkloadWidget({ employeeId }: Props) {
  const { t } = useTranslation();
  const { tasks, isPending } = useUnifiedTasks(employeeId);
  const { pendingTasks } = useApprovalQueue();

  const now = new Date();

  const stats = useMemo(() => {
    const active = tasks.filter(tk => tk.status !== 'completed' && tk.status !== 'cancelled').length;
    const completed = tasks.filter(tk => tk.status === 'completed').length;
    const overdue = tasks.filter(tk =>
      tk.due_date && isAfter(now, new Date(tk.due_date)) && tk.status !== 'completed' && tk.status !== 'cancelled'
    ).length;
    const total = tasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { active, completed, overdue, pending: pendingTasks.length, rate };
  }, [tasks, pendingTasks, now]);

  const upcoming = useMemo(() => {
    return tasks
      .filter(tk => tk.status !== 'completed' && tk.status !== 'cancelled' && tk.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 3);
  }, [tasks]);

  if (isPending) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const statItems = [
    { label: t('common.active'), value: stats.active, icon: Clock, color: 'text-primary' },
    { label: t('common.done'), value: stats.completed, icon: CheckCircle2, color: 'text-chart-1' },
    { label: t('common.overdue'), value: stats.overdue, icon: AlertTriangle, color: 'text-destructive' },
    { label: t('dashboard.workloadWidget.pendingApprovals'), value: stats.pending, icon: SquareCheckBig, color: 'text-chart-2' },
  ];

  return (
    <Card className="glass-card border-0 ring-1 ring-primary/10">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">{t('dashboard.workloadWidget.title')}</h3>
        </div>
        <Link
          to="/my-workload"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {t('dashboard.workloadWidget.viewAll')}
          <ChevronRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>

      <CardContent className="space-y-4 pt-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {statItems.map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-lg font-bold">{item.value}</span>
              <span className="text-2xs text-muted-foreground text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('dashboard.workloadWidget.completionRate')}</span>
            <span className="font-medium">{stats.rate}%</span>
          </div>
          <Progress value={stats.rate} className="h-2" />
        </div>

        {/* Upcoming Tasks */}
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{t('dashboard.workloadWidget.upcoming')}</p>
            <div className="space-y-1.5">
              {upcoming.map(task => (
                <div key={task.id} className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[task.priority] ?? 'bg-muted-foreground'}`} />
                  <span className="flex-1 truncate text-sm">{task.title}</span>
                  {task.due_date && (
                    <Badge variant="outline" className="text-2xs shrink-0">
                      {format(new Date(task.due_date), 'MMM d')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
