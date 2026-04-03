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
import { cardVariants, typography} from "@/theme/tokens";
import { cn } from "@/lib/utils";

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
    { label: t('common.active'), value: stats.active, icon: Clock },
    { label: t('common.done'), value: stats.completed, icon: CheckCircle2 },
    { label: t('common.overdue'), value: stats.overdue, icon: AlertTriangle },
    { label: t('dashboard.workloadWidget.pendingApprovals'), value: stats.pending, icon: SquareCheckBig },
  ];

  return (
    <Card className={cn(cardVariants.premiumVip)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <h3 className="font-semibold text-base">{t('dashboard.workloadWidget.title')}</h3>
        <Link
          to="/my-workload"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {t('dashboard.workloadWidget.viewAll')}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <CardContent className="space-y-5 pt-5">
        {/* Stats Row */}
        <div className="flex items-center">
          {statItems.map((item, i) => (
            <div key={item.label} className={cn(
              "flex flex-col items-center flex-1 gap-1",
              i < statItems.length - 1 && "border-e border-border/40"
            )}>
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xl font-bold leading-none">{item.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t('dashboard.workloadWidget.completionRate')}</span>
            <span className="font-medium">{stats.rate}%</span>
          </div>
          <Progress value={stats.rate} className="h-1.5" />
        </div>

        {/* Upcoming Tasks */}
        {upcoming.length > 0 && (
          <div className="space-y-1">
            <p className={typography.statLabel}>{t('dashboard.workloadWidget.upcoming')}</p>
            <div>
              {upcoming.map((task, i) => (
                <div key={task.id} className={cn(
                  "flex items-center gap-2 py-2.5",
                  i < upcoming.length - 1 && "border-b border-border/30"
                )}>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[task.priority] ?? 'bg-muted-foreground'}`} />
                  <span className="flex-1 truncate text-sm">{task.title}</span>
                  {task.due_date && (
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {format(new Date(task.due_date), 'MMM d')}
                    </span>
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
