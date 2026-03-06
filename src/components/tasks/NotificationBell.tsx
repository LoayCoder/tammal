import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell, CheckCircle2, MessageSquare, AlertTriangle, UserPlus,
  ShieldCheck, XCircle, Clock, CheckCheck,
} from 'lucide-react';
import { useTaskNotifications, type TaskNotification } from '@/hooks/tasks/useTaskNotifications';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICONS: Record<string, typeof Bell> = {
  assigned: UserPlus,
  status_changed: Clock,
  comment_added: MessageSquare,
  overdue: AlertTriangle,
  approval_requested: ShieldCheck,
  approved: CheckCircle2,
  rejected: XCircle,
};

const TYPE_COLORS: Record<string, string> = {
  assigned: 'text-chart-2',
  status_changed: 'text-chart-4',
  comment_added: 'text-primary',
  overdue: 'text-destructive',
  approval_requested: 'text-chart-5',
  approved: 'text-chart-1',
  rejected: 'text-destructive',
};

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useTaskNotifications();
  const [open, setOpen] = useState(false);

  const handleClick = (notification: TaskNotification) => {
    if (!notification.is_read) markRead(notification.id);
    setOpen(false);
    navigate(`/tasks/${notification.task_id}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -end-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium text-sm">{t('notifications.title')}</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="h-3 w-3" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('notifications.empty')}
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map(n => {
                const Icon = TYPE_ICONS[n.type] ?? Bell;
                const colorClass = TYPE_COLORS[n.type] ?? 'text-muted-foreground';

                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-start p-3 hover:bg-muted/50 transition-colors flex gap-3 ${
                      !n.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className={`text-xs line-clamp-2 ${!n.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{n.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
