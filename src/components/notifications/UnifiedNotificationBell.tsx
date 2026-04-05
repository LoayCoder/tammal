import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer, DrawerContent, DrawerTrigger, DrawerTitle,
} from '@/components/ui/drawer';
import {
  Rss, CheckCircle2, MessageSquare, AlertTriangle, UserPlus,
  ShieldCheck, XCircle, Clock, CheckCheck, ListChecks, Timer,
  UserCheck, Check, X, Award, ThumbsUp, Activity, TrendingDown,
  Heart, BellRing,
} from 'lucide-react';
import { useTaskNotifications, type TaskNotification } from '@/features/tasks/hooks/useTaskNotifications';
import { useCrisisNotifications, type CrisisNotification } from '@/hooks/crisis/useCrisisNotifications';
import { useRecognitionNotifications, type RecognitionNotification } from '@/hooks/recognition/useRecognitionNotifications';
import { useEngagementNotifications, type EngagementNotification } from '@/features/team-pulse/hooks/useEngagementNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';
import { useIsMobile } from '@/hooks/ui/use-mobile';

/** Extract task name from English title like "New task assigned: My Task" */
function extractTaskName(title: string): string {
  const colonIdx = title.indexOf(':');
  return colonIdx >= 0 ? title.slice(colonIdx + 1).trim() : title;
}

/** Translate notification title using type-based mapping */
function getTranslatedTitle(n: UnifiedNotification, t: (key: string, opts?: any) => string): string {
  const typeKey = `notifications.type.${n.type}`;
  const translated = t(typeKey, { name: extractTaskName(n.title), defaultValue: '' });
  return translated || n.title;
}

/** Translate notification body using type-based mapping */
function getTranslatedBody(n: UnifiedNotification, t: (key: string, opts?: any) => string): string | null {
  if (!n.body) return null;
  const bodyKey = `notifications.body.${n.type}`;
  const translated = t(bodyKey, { defaultValue: '' });
  return translated || n.body;
}

type NotificationSource = 'task' | 'crisis' | 'recognition' | 'engagement';

interface UnifiedNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  source: NotificationSource;
  navigateTo: string;
}

const TASK_ICONS: Record<string, typeof Rss> = {
  assigned: UserPlus,
  status_changed: Clock,
  comment_added: MessageSquare,
  overdue: AlertTriangle,
  approval_requested: ShieldCheck,
  approved: CheckCircle2,
  rejected: XCircle,
  checklist_completed: ListChecks,
  deadline_approaching: Timer,
};

const CRISIS_ICONS: Record<string, typeof Rss> = {
  case_assigned: AlertTriangle,
  case_accepted: UserCheck,
  case_declined: X,
  new_message: MessageSquare,
  case_resolved: Check,
  escalation: AlertTriangle,
};

const RECOGNITION_ICONS: Record<string, typeof Rss> = {
  endorsement_requested: ThumbsUp,
  nomination_endorsed: Award,
  nomination_received: UserPlus,
  nomination_approved: CheckCircle2,
  nomination_rejected: XCircle,
  award_won: Award,
};

const TASK_COLORS: Record<string, string> = {
  assigned: 'text-chart-2',
  status_changed: 'text-chart-4',
  comment_added: 'text-primary',
  overdue: 'text-destructive',
  approval_requested: 'text-chart-5',
  approved: 'text-chart-1',
  rejected: 'text-destructive',
  checklist_completed: 'text-chart-2',
  deadline_approaching: 'text-chart-5',
};

const CRISIS_COLORS: Record<string, string> = {
  escalation: 'text-destructive',
  case_assigned: 'text-chart-5',
  case_declined: 'text-destructive',
};

const RECOGNITION_COLORS: Record<string, string> = {
  endorsement_requested: 'text-chart-2',
  nomination_endorsed: 'text-chart-1',
  nomination_received: 'text-chart-2',
  nomination_approved: 'text-chart-1',
  nomination_rejected: 'text-destructive',
  award_won: 'text-chart-5',
};

function normalizeTask(n: TaskNotification): UnifiedNotification {
  return {
    id: n.id, type: n.type, title: n.title, body: n.body,
    is_read: n.is_read, created_at: n.created_at, source: 'task',
    navigateTo: `/tasks/${n.task_id}`,
  };
}

function normalizeCrisis(n: CrisisNotification): UnifiedNotification {
  return {
    id: n.id, type: n.type, title: n.title, body: n.body ?? null,
    is_read: n.is_read, created_at: n.created_at, source: 'crisis',
    navigateTo: '/my-support',
  };
}

function normalizeRecognition(n: RecognitionNotification): UnifiedNotification {
  const navigateTo = n.type === 'endorsement_requested'
    ? '/recognition/my-nominations?tab=endorse'
    : '/recognition/my-nominations?tab=received';
  return {
    id: n.id, type: n.type, title: n.title, body: n.body,
    is_read: n.is_read, created_at: n.created_at, source: 'recognition',
    navigateTo,
  };
}

function getIcon(n: UnifiedNotification) {
  if (n.source === 'task') return TASK_ICONS[n.type] ?? Rss;
  if (n.source === 'crisis') return CRISIS_ICONS[n.type] ?? Rss;
  return RECOGNITION_ICONS[n.type] ?? Award;
}

function getColor(n: UnifiedNotification) {
  if (n.source === 'task') return TASK_COLORS[n.type] ?? 'text-muted-foreground';
  if (n.source === 'crisis') return CRISIS_COLORS[n.type] ?? 'text-muted-foreground';
  return RECOGNITION_COLORS[n.type] ?? 'text-muted-foreground';
}

/* ─── Shared inner content ─── */

interface NotificationContentProps {
  tab: 'all' | NotificationSource;
  setTab: (v: 'all' | NotificationSource) => void;
  filtered: UnifiedNotification[];
  totalUnread: number;
  taskUnread: number;
  crisisUnread: number;
  recognitionUnread: number;
  onMarkAllRead: () => void;
  onItemClick: (n: UnifiedNotification) => void;
  isMobile: boolean;
  t: any;
}

function NotificationContent({
  tab, setTab, filtered, totalUnread, taskUnread, crisisUnread, recognitionUnread,
  onMarkAllRead, onItemClick, isMobile, t,
}: NotificationContentProps) {
  const { i18n } = useTranslation();
  const scrollH = isMobile ? 'max-h-[60vh]' : 'max-h-[340px]';

  return (
    <>
      <div className="flex items-center justify-between p-3 border-b">
        <h4 className="font-medium text-sm">{t('notifications.title')}</h4>
        {totalUnread > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onMarkAllRead}>
            <CheckCheck className="h-3 w-3" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="w-full rounded-none border-b h-9">
          <TabsTrigger value="all" className="flex-1 text-2xs h-7 px-1">
            {t('notifications.all', 'All')}
            {totalUnread > 0 && <Badge variant="secondary" className="ms-0.5 h-4 min-w-4 px-0.5 text-2xs">{totalUnread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="task" className="flex-1 text-2xs h-7 px-1">
            {isMobile ? <ListChecks className="h-3.5 w-3.5" /> : t('notifications.tasks', 'Tasks')}
            {taskUnread > 0 && <Badge variant="secondary" className="ms-0.5 h-4 min-w-4 px-0.5 text-2xs">{taskUnread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="crisis" className="flex-1 text-2xs h-7 px-1">
            {isMobile ? <AlertTriangle className="h-3.5 w-3.5" /> : t('notifications.crisis', 'Crisis')}
            {crisisUnread > 0 && <Badge variant="secondary" className="ms-0.5 h-4 min-w-4 px-0.5 text-2xs">{crisisUnread}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="recognition" className="flex-1 text-2xs h-7 px-1">
            {isMobile ? <Award className="h-3.5 w-3.5" /> : t('notifications.recognition', 'Recognition')}
            {recognitionUnread > 0 && <Badge variant="secondary" className="ms-0.5 h-4 min-w-4 px-0.5 text-2xs">{recognitionUnread}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-0">
          <ScrollArea className={scrollH}>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('notifications.empty')}
              </p>
            ) : (
              <div className="divide-y">
                {filtered.map(n => {
                  const Icon = getIcon(n);
                  const colorClass = getColor(n);
                  return (
                    <button
                      key={`${n.source}-${n.id}`}
                      onClick={() => onItemClick(n)}
                      className={`w-full text-start p-3 hover:bg-muted/50 transition-colors flex gap-3 ${
                        !n.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorClass}`} />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className={`text-xs line-clamp-2 ${!n.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                          {getTranslatedTitle(n, t)}
                        </p>
                        {getTranslatedBody(n, t) && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{getTranslatedBody(n, t)}</p>
                        )}
                        <p className="text-2xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: i18n.language === 'ar' ? arLocale : enUS })}
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
        </TabsContent>
      </Tabs>
    </>
  );
}

/* ─── Main component ─── */

export function UnifiedNotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | NotificationSource>('all');

  const {
    notifications: taskNotifications, unreadCount: taskUnread,
    markRead: markTaskRead, markAllRead: markAllTaskRead,
  } = useTaskNotifications();

  const {
    notifications: crisisNotifications, unreadCount: crisisUnread,
    markAsRead: markCrisisRead, markAllAsRead: markAllCrisisRead,
  } = useCrisisNotifications();

  const {
    notifications: recognitionNotifications, unreadCount: recognitionUnread,
    markAsRead: markRecognitionRead, markAllAsRead: markAllRecognitionRead,
  } = useRecognitionNotifications();

  const merged = useMemo(() => {
    const tasks = taskNotifications.map(normalizeTask);
    const crisis = crisisNotifications.map(normalizeCrisis);
    const recognition = recognitionNotifications.map(normalizeRecognition);
    return [...tasks, ...crisis, ...recognition].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [taskNotifications, crisisNotifications, recognitionNotifications]);

  const totalUnread = taskUnread + crisisUnread + recognitionUnread;

  const filtered = useMemo(() => {
    if (tab === 'all') return merged;
    return merged.filter(n => n.source === tab);
  }, [merged, tab]);

  const handleClick = (n: UnifiedNotification) => {
    if (!n.is_read) {
      if (n.source === 'task') markTaskRead(n.id);
      else if (n.source === 'crisis') markCrisisRead.mutate(n.id);
      else markRecognitionRead.mutate(n.id);
    }
    setOpen(false);
    navigate(n.navigateTo);
  };

  const handleMarkAllRead = () => {
    if (taskUnread > 0) markAllTaskRead();
    if (crisisUnread > 0) markAllCrisisRead.mutate();
    if (recognitionUnread > 0) markAllRecognitionRead.mutate();
  };

  const bellButton = (
    <Button variant="ghost" size="icon" className="relative">
      <Rss className="h-5 w-5" strokeWidth={1.75} />
      {totalUnread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -end-1 h-5 min-w-5 px-1 text-2xs flex items-center justify-center"
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </Badge>
      )}
    </Button>
  );

  const contentProps: NotificationContentProps = {
    tab, setTab, filtered, totalUnread, taskUnread, crisisUnread, recognitionUnread,
    onMarkAllRead: handleMarkAllRead, onItemClick: handleClick, isMobile, t,
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{bellButton}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerTitle className="sr-only">{t('notifications.title')}</DrawerTitle>
          <NotificationContent {...contentProps} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{bellButton}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <NotificationContent {...contentProps} />
      </PopoverContent>
    </Popover>
  );
}
