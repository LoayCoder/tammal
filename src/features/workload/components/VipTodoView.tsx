import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usePersonalTodos, parseSmartInput } from '../hooks/usePersonalTodos';
import { AIDailyTip } from './AIDailyTip';
import { getLocalDateString } from '@/utils/getLocalDate';
import {
  Sparkles, Flame, Trash2, MoreHorizontal, ArrowRightLeft,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-destructive',
  2: 'bg-chart-5',
  3: 'bg-chart-4',
  4: 'bg-muted-foreground/40',
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

  const todayTodos = useMemo(() =>
    todos.filter(td => !td.is_completed || (td.completed_at && td.completed_at.split('T')[0] === todayStr)),
    [todos, todayStr],
  );

  const completedToday = useMemo(() =>
    todos.filter(td => td.is_completed && td.completed_at && td.completed_at.split('T')[0] === todayStr).length,
    [todos, todayStr],
  );

  const pendingTodos = useMemo(() => todos.filter(td => !td.is_completed), [todos]);
  const focusTodo = pendingTodos[0] ?? null; // already sorted by priority ASC, due ASC

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
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const totalForProgress = pendingTodos.length + completedToday;
  const progressPct = totalForProgress > 0 ? (completedToday / totalForProgress) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* AI Tip */}
      <AIDailyTip
        todoCount={pendingTodos.length}
        criticalCount={criticalCount}
        completedCount={completedToday}
        employeeName={employeeName}
      />

      {/* Smart Input */}
      <div className="relative">
        <Sparkles className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" strokeWidth={1.75} />
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder={t('commandCenter.todoPlaceholder', 'What do you need to do today?')}
          className="ps-9 rounded-xl border-border/50 bg-muted/10 focus-visible:ring-primary/30 min-h-[44px]"
          enterKeyHint="done"
        />
      </div>

      {/* Progress */}
      {totalForProgress > 0 && (
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground font-medium tabular-nums whitespace-nowrap">
            {completedToday} / {totalForProgress} {t('commandCenter.completedToday', 'today')}
          </span>
        </div>
      )}

      {/* Focus Task */}
      {focusTodo && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 min-h-[44px]">
          <Flame className="h-4 w-4 text-chart-4 shrink-0" strokeWidth={1.75} />
          <span className="text-sm font-medium flex-1 truncate">{focusTodo.title}</span>
          <span className="text-2xs text-muted-foreground">
            {t('commandCenter.focusTask', 'Focus')}
          </span>
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-px">
        {todayTodos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" strokeWidth={1.25} />
            <p className="text-sm text-muted-foreground">{t('commandCenter.todoEmpty', 'Your day is clear. Add a task to get started.')}</p>
          </div>
        )}
        {todayTodos.map(todo => (
          <div
            key={todo.id}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/10 transition-all duration-200 min-h-[44px] ${
              todo.is_completed ? 'opacity-50' : ''
            }`}
          >
            <Checkbox
              checked={todo.is_completed}
              onCheckedChange={() => toggleComplete.mutate(todo.id)}
              className="transition-transform duration-150 active:scale-110"
            />
            <div className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_COLORS[todo.priority] ?? PRIORITY_COLORS[3]}`} />
            <span className={`flex-1 text-sm min-w-0 truncate ${todo.is_completed ? 'line-through text-muted-foreground' : ''}`}>
              {todo.title}
            </span>
            {todo.due_date && (
              <span className="text-2xs text-muted-foreground shrink-0">
                {todo.due_date === todayStr ? t('commandCenter.dueToday', 'Today') :
                 todo.due_date < todayStr ? t('commandCenter.overdue', 'Overdue') :
                 todo.due_date}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-muted/20 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-[0.97]">
                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => deleteTodo.mutate(todo.id)} className="text-destructive gap-2">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('common.delete', 'Delete')}
                </DropdownMenuItem>
                {todo.linked_task_id === null && !todo.is_completed && (
                  <DropdownMenuItem className="gap-2" disabled>
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
