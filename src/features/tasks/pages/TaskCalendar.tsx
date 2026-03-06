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
import {
  ChevronLeft, ChevronRight, CalendarDays, Plus,
} from 'lucide-react';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useUnifiedTasks } from '@/hooks/workload/useUnifiedTasks';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, addWeeks, subWeeks,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO,
} from 'date-fns';

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

export default function TaskCalendar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { tasks, isPending: tasksLoading } = useUnifiedTasks(employee?.id);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [createOpen, setCreateOpen] = useState(false);

  // Build day cells
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

  // Map tasks by due_date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    tasks.forEach(task => {
      if (!task.due_date) return;
      const key = task.due_date.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return map;
  }, [tasks]);

  const handlePrev = () => {
    setCurrentDate(prev => view === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1));
  };

  const handleNext = () => {
    setCurrentDate(prev => view === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const weekDayHeaders = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 0 }) })
      .map(d => format(d, 'EEE'));
  }, []);

  const isLoading = empLoading || tasksLoading;

  // Count tasks without due date
  const unscheduledCount = useMemo(() => tasks.filter(t => !t.due_date).length, [tasks]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {t('tasks.calendar.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('tasks.calendar.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />{t('tasks.create')}
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card className="border-0 bg-muted/30">
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <h2 className="text-sm font-semibold min-w-[160px] text-center">
              {view === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : `${format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d')} — ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'MMM d, yyyy')}`
              }
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext}>
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
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t('tasks.calendar.month')}</SelectItem>
                <SelectItem value="week">{t('tasks.calendar.week')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      {isLoading ? (
        <Skeleton className="h-[500px]" />
      ) : (
        <Card className="border-0 overflow-hidden">
          <CardContent className="p-0">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b">
              {weekDayHeaders.map(day => (
                <div key={day} className="py-2 px-1 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className={`grid grid-cols-7 ${view === 'week' ? 'min-h-[300px]' : ''}`}>
              {days.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDate.get(dateKey) ?? [];
                const inMonth = view === 'month' ? isSameMonth(day, currentDate) : true;
                const today = isToday(day);
                const maxVisible = view === 'week' ? 8 : 3;
                const overflow = dayTasks.length - maxVisible;

                return (
                  <div
                    key={dateKey}
                    className={`border-b border-e min-h-[80px] p-1 transition-colors ${
                      !inMonth ? 'bg-muted/20' : 'hover:bg-muted/10'
                    } ${view === 'week' ? 'min-h-[200px]' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full mx-auto ${
                      today ? 'bg-primary text-primary-foreground' : inMonth ? '' : 'text-muted-foreground/50'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, maxVisible).map(task => (
                        <button
                          key={task.id}
                          onClick={() => navigate(`/tasks/${task.id}`)}
                          className={`w-full text-start rounded px-1.5 py-0.5 text-[10px] leading-tight truncate flex items-center gap-1 transition-colors hover:ring-1 hover:ring-ring ${
                            STATUS_COLORS[task.status] ?? STATUS_COLORS.draft
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${PRIORITY_DOTS[task.priority] ?? PRIORITY_DOTS[2]}`} />
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                      {overflow > 0 && (
                        <p className="text-[10px] text-muted-foreground text-center">
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

      {employee && <CreateTaskModal open={createOpen} onOpenChange={setCreateOpen} employeeId={employee.id} employeeName={employee.full_name} />}
    </div>
  );
}
