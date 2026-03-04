import { useTranslation } from 'react-i18next';
import { useEscalationEvents } from '@/hooks/workload/useEscalationEvents';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  taskId: string;
}

const levelConfig: Record<number, { icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' }> = {
  1: { icon: Clock, variant: 'default' },
  2: { icon: ArrowUp, variant: 'secondary' },
  3: { icon: AlertTriangle, variant: 'destructive' },
};

export function EscalationTimeline({ taskId }: Props) {
  const { t } = useTranslation();
  const { events, isPending } = useEscalationEvents(taskId);

  if (isPending) return <Skeleton className="h-20 w-full" />;
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">{t('governance.escalation.noEvents')}</p>;
  }

  return (
    <div className="relative space-y-4 ps-6">
      <div className="absolute start-2.5 top-0 bottom-0 w-px bg-border" />
      {events.map(ev => {
        const cfg = levelConfig[ev.escalation_level] ?? levelConfig[1];
        const Icon = cfg.icon;
        return (
          <div key={ev.id} className="relative flex items-start gap-3">
            <div className="absolute start-[-18px] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border">
              <Icon className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={cfg.variant} className="text-xs">
                  {t('governance.escalation.level')} {ev.escalation_level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(ev.created_at), 'PPp')}
                </span>
              </div>
              {ev.reason && <p className="text-sm text-foreground">{ev.reason}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
