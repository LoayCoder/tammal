import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { isAfter, format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedTasks } from '@/features/workload/hooks/useUnifiedTasks';
import { useApprovalQueue } from '@/features/tasks/hooks/useApprovalQueue';
import {
  ChevronRight, CheckCircle2, AlertTriangle,
  Clock, SquareCheckBig, ClipboardList, EyeOff, Eye,
} from 'lucide-react';
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

const HIDDEN_KEY = 'workload-widget-hidden';

interface Props {
  employeeId: string;
}

export function DashboardWorkloadWidget({ employeeId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === '1');
  const hide = useCallback(() => { localStorage.setItem(HIDDEN_KEY, '1'); setIsHidden(true); }, []);
  const show = useCallback(() => { localStorage.removeItem(HIDDEN_KEY); setIsHidden(false); }, []);
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

  if (isPending && !isHidden) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const statItems = [
    {
      label: t('common.active'),
      value: stats.active,
      icon: Clock,
      color: 'text-[hsl(var(--state-pending))]',
      bg: 'bg-[hsl(var(--state-pending))]/10',
    },
    {
      label: t('common.done'),
      value: stats.completed,
      icon: CheckCircle2,
      color: 'text-[hsl(var(--state-completed))]',
      bg: 'bg-[hsl(var(--state-completed))]/10',
    },
    {
      label: t('common.overdue'),
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'text-[hsl(var(--state-overdue))]',
      bg: 'bg-[hsl(var(--state-overdue))]/10',
    },
    {
      label: t('dashboard.workloadWidget.pendingApprovals'),
      value: stats.pending,
      icon: SquareCheckBig,
      color: 'text-[hsl(var(--state-important))]',
      bg: 'bg-[hsl(var(--state-important))]/10',
    },
  ];

  /** Status badge color for a task */
  const getTaskStatusStyle = (task: typeof tasks[0]) => {
    const isOverdue = task.due_date && isAfter(now, new Date(task.due_date));
    if (task.status === 'completed') return { color: 'text-[hsl(var(--state-completed))]', bg: 'bg-[hsl(var(--state-completed))]/10', label: t('common.done') };
    if (isOverdue) return { color: 'text-[hsl(var(--state-overdue))]', bg: 'bg-[hsl(var(--state-overdue))]/10', label: t('common.overdue') };
    return { color: 'text-[hsl(var(--state-pending))]', bg: 'bg-[hsl(var(--state-pending))]/10', label: t('common.active') };
  };

  // Progress bar gradient color based on rate
  const progressColor = stats.rate >= 80
    ? 'from-[hsl(var(--state-completed))] to-[hsl(var(--state-completed))]/80'
    : stats.rate >= 40
      ? 'from-[hsl(var(--state-important))] to-[hsl(var(--state-pending))]'
      : 'from-[hsl(var(--state-overdue))] to-[hsl(var(--state-important))]';

  if (isHidden) {
    return (
      <Card className={cn(cardVariants.premiumVip, "opacity-80")}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground font-medium">
              {isAr ? 'أعبائي مخفية' : 'My Workload hidden'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={show} className="gap-1 text-xs h-7 text-muted-foreground hover:text-foreground">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            {isAr ? 'إظهار' : 'Show'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(cardVariants.premiumVip)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-0">
        <h3 className="font-semibold text-base">{t('dashboard.workloadWidget.title')}</h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={hide} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" title={isAr ? 'إخفاء' : 'Hide'}>
            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
          <Link to="/my-workload" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            {t('dashboard.workloadWidget.viewAll')}
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>

      <CardContent className="space-y-5 pt-5">
        {/* Stats Row */}
        <div className="flex items-center">
          {statItems.map((item, i) => (
            <div key={item.label} className={cn(
              "flex flex-col items-center flex-1 gap-1.5",
              i < statItems.length - 1 && "border-e border-border/40"
            )}>
              <item.icon className={cn('h-4 w-4', item.color)} strokeWidth={1.5} />
              <span className="text-xl font-bold leading-none">{item.value}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{t('dashboard.workloadWidget.completionRate')}</span>
            <span className="font-semibold text-foreground">{stats.rate}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out', progressColor)}
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>

        {/* Upcoming Tasks */}
        {upcoming.length > 0 ? (
          <div className="space-y-1">
            <p className={typography.statLabel}>{t('dashboard.workloadWidget.upcoming')}</p>
            <div>
              {upcoming.map((task, i) => {
                const statusStyle = getTaskStatusStyle(task);
                return (
                  <button
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className={cn(
                      "flex items-center gap-2 py-2 w-full text-start group",
                      "hover:bg-muted/30 transition-colors duration-150 cursor-pointer rounded px-1 -mx-1",
                      i < upcoming.length - 1 && "border-b border-border/20"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                    </div>

                    {task.due_date && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(task.due_date), 'MMM d')}
                      </span>
                    )}

                    <span className={cn('text-[9px] font-medium shrink-0', statusStyle.color)}>
                      {statusStyle.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <ClipboardList className="h-6 w-6 text-[hsl(var(--state-completed))]" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">
              {isAr ? 'لا توجد مهام قادمة 🎉' : 'No upcoming tasks 🎉'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'أنت على المسار الصحيح!' : "You're all caught up!"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
