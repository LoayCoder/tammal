import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCrisisNotifications } from '@/hooks/crisis/useCrisisNotifications';
import { Bell, Check, CheckCheck, MessageSquare, AlertTriangle, UserCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TYPE_ICONS: Record<string, any> = {
  case_assigned: AlertTriangle,
  case_accepted: UserCheck,
  case_declined: X,
  new_message: MessageSquare,
  case_resolved: Check,
  escalation: AlertTriangle,
};

export default function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useCrisisNotifications();
  const [open, setOpen] = useState(false);

  if (notifications.length === 0 && unreadCount === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -end-1 h-5 min-w-5 text-[10px] px-1 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h4 className="text-sm font-semibold">{t('crisisSupport.notifications.title')}</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => markAllAsRead.mutate()}>
              <CheckCheck className="h-3 w-3" />
              {t('crisisSupport.notifications.markAllRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">{t('crisisSupport.notifications.empty')}</p>
          ) : (
            notifications.slice(0, 20).map(n => {
              const Icon = TYPE_ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  className={`w-full text-start px-3 py-2.5 border-b border-border/50 hover:bg-muted/50 transition-colors flex items-start gap-3 ${!n.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => {
                    if (!n.is_read) markAsRead.mutate(n.id);
                    if (n.case_id) navigate('/my-support');
                    setOpen(false);
                  }}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'escalation' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
