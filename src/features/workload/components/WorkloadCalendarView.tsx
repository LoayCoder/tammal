import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks,
  eachDayOfInterval, isSameMonth, isToday,
} from 'date-fns';
import type { UnifiedTask } from '@/features/workload/hooks/useUnifiedTasks';
import type { PersonalTodo } from '@/features/workload/hooks/usePersonalTodos';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-chart-2/15 text-chart-2',
  in_progress: 'bg-chart-2/15 text-chart-2',
  under_review: 'bg-chart-4/15 text-chart-4',
  pending_approval: 'bg-chart-5/15 text-chart-5',
  completed: 'bg-chart-1/15 text-chart-1',
  rejected: 'bg-destructive/15 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};

const PRIORITY_DOTS: Record<number, string> = {
  0: 'bg-destructive',
  1: 'bg-chart-5',
  2: 'bg-chart-4',
  3: 'bg-muted-foreground',
};

interface CalendarEvent {
  id: string;
  title: string;
  dateKey: string;
  type: 'task' | 'todo';
  status?: string;
  priority?: number;
  time?: string;
}

interface WorkloadCalendarViewProps {
  tasks: UnifiedTask[];
  isPending: boolean;
  todos?: PersonalTodo[];
}

export function WorkloadCalendarView({ tasks, isPending, todos = [] }: WorkloadCalendarViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const days = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: calStart, end: calEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  }, [currentDate, view]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    // Add tasks
    tasks.forEach(task => {
      if (!task.due_date) return;
      const key = task.due_date.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        id: task.id,
        title: task.title,
        dateKey: key,
        type: 'task',
        status: task.status,
        priority: task.priority,
      });
    });

    // Add todos
    todos.forEach(todo => {
      if (!todo.due_date || todo.is_completed) return;
      const key = todo.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        id: todo.id,
        title: todo.title,
        dateKey: key,
        type: 'todo',
        priority: todo.priority,
        time: todo.due_time?.substring(0, 5) ?? undefined,
      });
    });

    return map;
  }, [tasks, todos]);

  const handlePrev = () => setCurrentDate(prev => view === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  const handleNext = () => setCurrentDate(prev => view === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  const weekDayHeaders = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 0 }) })
      .map(d => format(d, 'EEE'));
  }, []);

  const unscheduledCount = useMemo(() => tasks.filter(t => !t.due_date).length, [tasks]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="border-0 bg-muted/30">
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label={t('common.previous')} className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <h2 className="text-sm font-semibold min-w-[160px] text-center">
              {view === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} — ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
              }
            </h2>
            <Button variant="ghost" size="icon" aria-label={t('common.next')} className="h-8 w-8" onClick={handleNext}>
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleToday}>
              {t('tasks.calendar.today')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {unscheduledCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unscheduledCount} {t('tasks.calendar.unscheduled')}
              </Badge>
            )}
            <Select value={view} onValueChange={(v) => setView(v as 'month' | 'week')}>
              <SelectTrigger className="w-[100px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t('tasks.calendar.month')}</SelectItem>
                <SelectItem value="week">{t('tasks.calendar.week')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {isPending ? (
        <Skeleton className="h-[500px]" />
      ) : (
        <Card className="border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {weekDayHeaders.map(day => (
                <div key={day} className="py-2 px-0.5 sm:px-1 text-center text-2xs sm:text-xs font-medium text-muted-foreground">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>
            <div className={`grid grid-cols-7 ${view === 'week' ? 'min-h-[300px]' : ''}`}>
              {days.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate.get(dateKey) ?? [];
                const inMonth = view === 'month' ? isSameMonth(day, currentDate) : true;
                const today = isToday(day);
                const maxVisible = view === 'week' ? 8 : 3;
                const overflow = dayEvents.length - maxVisible;

                return (
                  <div
                    key={dateKey}
                    className={`border-b border-e min-h-[60px] sm:min-h-[80px] p-0.5 sm:p-1 transition-colors ${
                      !inMonth ? 'bg-muted/20' : 'hover:bg-muted/10'
                    } ${view === 'week' ? 'min-h-[150px] sm:min-h-[200px]' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full mx-auto ${
                      today ? 'bg-primary text-primary-foreground' : inMonth ? '' : 'text-muted-foreground/50'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, maxVisible).map(event => (
                        <button
                          key={event.id}
                          onClick={() => event.type === 'task' ? navigate(`/tasks/${event.id}`) : undefined}
                          className={`w-full text-start rounded px-1.5 py-0.5 text-2xs leading-tight truncate flex items-center gap-1 transition-colors hover:ring-1 hover:ring-ring ${
                            event.type === 'todo'
                              ? 'bg-primary/10 text-primary border border-dashed border-primary/20'
                              : (STATUS_COLORS[event.status ?? 'draft'] ?? STATUS_COLORS.draft)
                          }`}
                        >
                          {event.type === 'todo' && <Sparkles className="h-2.5 w-2.5 shrink-0" />}
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            event.type === 'todo' ? '' : (PRIORITY_DOTS[event.priority ?? 2] ?? PRIORITY_DOTS[2])
                          }`} />
                          <span className="truncate">{event.title}</span>
                          {event.time && <span className="text-[9px] opacity-60 shrink-0">{event.time}</span>}
                        </button>
                      ))}
                      {overflow > 0 && (
                        <p className="text-2xs text-muted-foreground text-center">
                          +{overflow} {t('tasks.calendar.more')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
