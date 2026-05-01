import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usePersonalTodos, parseSmartInput } from '@/features/workload/hooks/usePersonalTodos';
import { getLocalDateString } from '@/utils/getLocalDate';
import {
  Sparkles, ChevronRight, AlertCircle, Plus,
} from 'lucide-react';
import { cardVariants } from '@/theme/tokens';
import { cn } from '@/lib/utils';

interface Props {
  employeeId: string;
  tenantId: string;
}

export function DashboardTodoWidget({ employeeId, tenantId }: Props) {
  const { t } = useTranslation();
  const { todos, isPending, createTodo, toggleComplete } = usePersonalTodos(employeeId);
  const [input, setInput] = useState('');

  const todayStr = getLocalDateString();

  const pendingTodos = useMemo(() => todos.filter(td => !td.is_completed), [todos]);
  const overdueTodos = useMemo(() =>
    pendingTodos.filter(td => td.due_date && td.due_date < todayStr),
    [pendingTodos, todayStr],
  );
  const todayTodos = useMemo(() =>
    pendingTodos.filter(td => !td.due_date || td.due_date >= todayStr).slice(0, 5),
    [pendingTodos, todayStr],
  );
  const completedTodayCount = useMemo(() =>
    todos.filter(td => td.is_completed && td.completed_at && td.completed_at.split('T')[0] === todayStr).length,
    [todos, todayStr],
  );

  const displayTodos = useMemo(() => [...overdueTodos.slice(0, 2), ...todayTodos].slice(0, 5), [overdueTodos, todayTodos]);
  const totalForProgress = pendingTodos.length + completedTodayCount;
  const progressPct = totalForProgress > 0 ? (completedTodayCount / totalForProgress) * 100 : 0;

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const parsed = parseSmartInput(trimmed);
    if (!parsed.title) return;
    createTodo.mutate({
      title: parsed.title,
      priority: parsed.priority,
      due_date: parsed.due_date,
      due_time: parsed.due_time,
      tenant_id: tenantId,
    });
    setInput('');
  }, [input, createTodo, tenantId]);

  if (isPending) {
    return (
      <Card className={cn(cardVariants.premiumVip, "rounded-2xl")}>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="h-1 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't render widget if no todos at all
  if (todos.length === 0) return null;

  return (
    <Card className={cn(cardVariants.premiumVip, "rounded-2xl")}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="text-sm font-bold">{t('commandCenter.todaysTasks', "Today's Tasks")}</h3>
          </div>
          <Link to="/my-workload?tab=todo">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:bg-primary/10 rounded-lg">
              {t('common.viewAll', 'View All')}
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </div>

        {/* Progress */}
        {totalForProgress > 0 && (
          <div className="flex items-center gap-2.5">
            <Progress value={progressPct} className="flex-1 h-1" />
            <span className="text-2xs text-muted-foreground font-medium tabular-nums">
              {completedTodayCount}/{totalForProgress}
            </span>
          </div>
        )}

        {/* Overdue Alert */}
        {overdueTodos.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/[0.06]">
            <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <span className="text-xs font-medium text-destructive">
              {overdueTodos.length} {t('commandCenter.overdueTasks', 'overdue')}
            </span>
          </div>
        )}

        {/* Todo items */}
        <div className="space-y-0.5">
          {displayTodos.map(todo => {
            const isOverdue = todo.due_date && todo.due_date < todayStr;
            return (
              <div key={todo.id} className="flex items-center gap-2.5 py-1.5 min-h-[36px]">
                <Checkbox
                  checked={todo.is_completed}
                  onCheckedChange={() => toggleComplete.mutate(todo.id)}
                  className="h-4 w-4 rounded shrink-0"
                />
                <span className="text-sm flex-1 truncate">{todo.title}</span>
                {isOverdue && (
                  <span className="text-2xs text-destructive font-medium shrink-0">
                    {t('commandCenter.overdue', 'Overdue')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Add */}
        <div className="relative">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder={t('commandCenter.quickAdd', 'Quick add task...')}
            className="text-xs h-9 rounded-lg bg-muted/5 border-border/30 pe-9"
          />
          {input.trim() && (
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSubmit}
              className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
