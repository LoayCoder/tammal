import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { usePersonalTodos, parseSmartInput } from '../hooks/usePersonalTodos';
import { AIDailyTip } from './AIDailyTip';
import { getLocalDateString } from '@/utils/getLocalDate';
import {
  Sparkles, Flame, Trash2, MoreHorizontal, ArrowRightLeft, Plus, Circle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PRIORITY_DOT: Record<number, string> = {
  1: 'text-destructive',
  2: 'text-chart-5',
  3: 'text-chart-4',
  4: 'text-muted-foreground/40',
};

const PRIORITY_LABEL: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Normal',
  4: 'Low',
};

interface Props {
  employeeId: string;
  employeeName: string;
  tenantId: string;
}

export function VipTodoView({ employeeId, employeeName, tenantId }: Props) {
  const { t } = useTranslation();
  const { todos, isPending, createTodo, toggleComplete, deleteTodo } = usePersonalTodos(employeeId);
  const [input, setInput] = useState('');

  const todayStr = getLocalDateString();

  // Show all uncompleted + today's completed
  const visibleTodos = useMemo(() => {
    const uncompleted = todos.filter(td => !td.is_completed);
    const completedToday = todos.filter(
      td => td.is_completed && td.completed_at && td.completed_at.split('T')[0] === todayStr,
    );
    return [...uncompleted, ...completedToday];
  }, [todos, todayStr]);

  const completedTodayCount = useMemo(() =>
    todos.filter(td => td.is_completed && td.completed_at && td.completed_at.split('T')[0] === todayStr).length,
    [todos, todayStr],
  );

  const pendingTodos = useMemo(() => todos.filter(td => !td.is_completed), [todos]);
  const focusTodo = pendingTodos[0] ?? null;
  const criticalCount = useMemo(() => pendingTodos.filter(td => td.priority === 1).length, [pendingTodos]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const parsed = parseSmartInput(trimmed);
    if (!parsed.title) return;
    createTodo.mutate({ title: parsed.title, priority: parsed.priority, due_date: parsed.due_date, tenant_id: tenantId });
    setInput('');
  };

  if (isPending) {
    return (
      <div className="space-y-5 animate-fade-in">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-6 w-48 rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  const totalForProgress = pendingTodos.length + completedTodayCount;
  const progressPct = totalForProgress > 0 ? (completedTodayCount / totalForProgress) * 100 : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* AI Tip */}
      <AIDailyTip
        todoCount={pendingTodos.length}
        criticalCount={criticalCount}
        completedCount={completedTodayCount}
        employeeName={employeeName}
      />

      {/* Smart Input */}
      <div className="relative group/input">
        <Sparkles className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within/input:text-primary transition-colors" strokeWidth={1.5} />
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder={t('commandCenter.todoPlaceholder', 'What do you need to do today?')}
          className="ps-10 pe-12 rounded-xl border-border/40 bg-muted/5 focus-visible:ring-primary/20 focus-visible:bg-background min-h-[48px] text-sm placeholder:text-muted-foreground/40 transition-all"
          enterKeyHint="done"
        />
        {input.trim() && (
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSubmit}
            className="absolute end-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {totalForProgress > 0 && (
        <div className="flex items-center gap-3 px-1">
          <Progress value={progressPct} className="flex-1 h-1" />
          <span className="text-2xs text-muted-foreground font-medium tabular-nums whitespace-nowrap">
            {completedTodayCount}/{totalForProgress}
          </span>
        </div>
      )}

      {/* Focus Task Banner */}
      {focusTodo && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/[0.04] border border-primary/10 min-h-[48px] transition-all">
          <Flame className="h-4 w-4 text-chart-4 shrink-0" strokeWidth={1.5} />
          <div className="flex-1 min-w-0">
            <span className="text-2xs text-muted-foreground/70 font-medium uppercase tracking-wider">
              {t('commandCenter.focusTask', 'Focus')}
            </span>
            <p className="text-sm font-medium truncate mt-0.5">{focusTodo.title}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs text-primary hover:bg-primary/10 shrink-0"
            onClick={() => toggleComplete.mutate(focusTodo.id)}
          >
            {t('commandCenter.markDone', 'Done')}
          </Button>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-0.5">
        {visibleTodos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="h-12 w-12 rounded-2xl bg-muted/10 flex items-center justify-center mb-4">
              <Sparkles className="h-5 w-5 text-muted-foreground/25" strokeWidth={1.25} />
            </div>
            <p className="text-sm text-muted-foreground/60 font-medium">
              {t('commandCenter.todoEmpty', 'Your day is clear')}
            </p>
            <p className="text-2xs text-muted-foreground/40 mt-1">
              {t('commandCenter.todoEmptyHint', 'Type above to add your first task')}
            </p>
          </div>
        )}

        {visibleTodos.map((todo, idx) => (
          <div
            key={todo.id}
            className={`group flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 min-h-[48px] ${
              todo.is_completed
                ? 'opacity-40'
                : 'hover:bg-muted/[0.06]'
            }`}
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <Checkbox
              checked={todo.is_completed}
              onCheckedChange={() => toggleComplete.mutate(todo.id)}
              className="h-[18px] w-[18px] rounded-[5px] transition-all duration-150 active:scale-110 data-[state=checked]:bg-primary/80"
            />

            <Circle
              className={`h-1.5 w-1.5 shrink-0 fill-current ${PRIORITY_DOT[todo.priority] ?? PRIORITY_DOT[3]}`}
              strokeWidth={0}
            />

            <span className={`flex-1 text-sm min-w-0 truncate transition-all duration-200 ${
              todo.is_completed ? 'line-through text-muted-foreground' : ''
            }`}>
              {todo.title}
            </span>

            {todo.due_date && (
              <span className={`text-2xs shrink-0 font-medium ${
                !todo.is_completed && todo.due_date < todayStr
                  ? 'text-destructive'
                  : 'text-muted-foreground/50'
              }`}>
                {todo.due_date === todayStr
                  ? t('commandCenter.dueToday', 'Today')
                  : todo.due_date < todayStr
                    ? t('commandCenter.overdue', 'Overdue')
                    : new Date(todo.due_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-md transition-opacity"
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => deleteTodo.mutate(todo.id)}
                  className="text-destructive gap-2 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('common.delete', 'Delete')}
                </DropdownMenuItem>
                {todo.linked_task_id === null && !todo.is_completed && (
                  <DropdownMenuItem className="gap-2 text-xs" disabled>
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    {t('commandCenter.convertToWorkload', 'Convert to Workload')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
