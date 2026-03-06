import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, CheckCircle2, Circle, MessageSquare, Paperclip,
  UserPlus, ArrowRightLeft, AlertTriangle, Clock, Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import type { TaskActivityLog } from '@/hooks/tasks/useTaskActivity';

interface TaskActivityTimelineProps {
  activities: TaskActivityLog[];
  isLoading: boolean;
}

const ACTION_ICONS: Record<string, { icon: typeof Activity; className: string }> = {
  created: { icon: Circle, className: 'text-chart-2' },
  status_changed: { icon: ArrowRightLeft, className: 'text-chart-4' },
  completed: { icon: CheckCircle2, className: 'text-chart-1' },
  comment_added: { icon: MessageSquare, className: 'text-chart-2' },
  attachment_added: { icon: Paperclip, className: 'text-muted-foreground' },
  member_added: { icon: UserPlus, className: 'text-chart-5' },
  priority_changed: { icon: AlertTriangle, className: 'text-chart-5' },
  due_date_changed: { icon: Clock, className: 'text-chart-4' },
};

const DEFAULT_ICON = { icon: Activity, className: 'text-muted-foreground' };

export function TaskActivityTimeline({ activities, isLoading }: TaskActivityTimelineProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string | null>(null);

  const actionTypes = useMemo(() => {
    const types = new Set(activities.map(a => a.action));
    return Array.from(types).sort();
  }, [activities]);

  const filtered = useMemo(
    () => filter ? activities.filter(a => a.action === filter) : activities,
    [activities, filter]
  );

  if (isLoading) return <Skeleton className="h-32" />;

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">{t('tasks.activity.empty')}</p>
      </div>
    );
  }

  const formatDetails = (action: string, details: Record<string, unknown>) => {
    if (!details || Object.keys(details).length === 0) return null;
    if (action === 'status_changed' && details.old_status && details.new_status) {
      return `${String(details.old_status).replace(/_/g, ' ')} → ${String(details.new_status).replace(/_/g, ' ')}`;
    }
    return JSON.stringify(details);
  };

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      {actionTypes.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Button
            variant={filter === null ? 'default' : 'outline'}
            size="sm"
            className="h-6 text-[10px] px-2"
            onClick={() => setFilter(null)}
          >
            {t('tasks.activity.all')} ({activities.length})
          </Button>
          {actionTypes.map(type => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              className="h-6 text-[10px] px-2 capitalize"
              onClick={() => setFilter(filter === type ? null : type)}
            >
              {type.replace(/_/g, ' ')} ({activities.filter(a => a.action === type).length})
            </Button>
          ))}
        </div>
      )}

      <ScrollArea className="max-h-[500px]">
        <div className="relative ps-8 space-y-0">
          <div className="absolute start-3 top-3 bottom-3 w-px bg-border" />
          {filtered.map((a, idx) => {
            const { icon: Icon, className: iconClass } = ACTION_ICONS[a.action] ?? DEFAULT_ICON;
            const detailText = formatDetails(a.action, a.details);
            const showDateSep = idx === 0 || format(new Date(a.created_at), 'PP') !== format(new Date(filtered[idx - 1].created_at), 'PP');

            return (
              <div key={a.id}>
                {showDateSep && (
                  <div className="flex items-center gap-3 py-2 -ms-8 ps-8">
                    <Badge variant="outline" className="text-[10px] font-medium">
                      {format(new Date(a.created_at), 'PP')}
                    </Badge>
                  </div>
                )}
                <div className="relative py-2.5 group hover:bg-muted/20 rounded-lg px-2 -ms-2 transition-colors">
                  <div className="absolute -start-[22px] top-3.5 flex items-center justify-center h-5 w-5 rounded-full bg-background border border-border">
                    <Icon className={`h-3 w-3 ${iconClass}`} />
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium capitalize">{a.action.replace(/_/g, ' ')}</span>
                        {a.employee?.full_name && (
                          <span className="text-xs text-muted-foreground">— {a.employee.full_name}</span>
                        )}
                      </div>
                      {detailText && (
                        <p className="text-xs text-muted-foreground">{detailText}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                      {format(new Date(a.created_at), 'p')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
