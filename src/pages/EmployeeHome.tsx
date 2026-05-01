import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCheck,
  ClipboardList,
  HeartHandshake,
  MoonStar,
  Phone,
  ShieldAlert,
  Sparkles,
  Star,
  Sunrise,
  Sunset,
  Target,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/questions/useScheduledQuestions';
import { useUnifiedTasks } from '@/features/workload';
import { useEmployeeEngagementRank } from '@/hooks/wellness/useEmployeeEngagementRank';

type DashboardMode = 'loading' | 'empty' | 'active' | 'urgent';
type DayPhase = 'morning' | 'afternoon' | 'evening';

type ActionItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  cta: string;
  href?: string;
  onClick?: () => void;
  chips: string[];
  urgent?: boolean;
};

type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  tone?: 'default' | 'urgent' | 'support';
  cta?: string;
  href?: string;
  onClick?: () => void;
};

function getDayPhase(): DayPhase {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getPhaseIcon(phase: DayPhase) {
  if (phase === 'morning') return Sunrise;
  if (phase === 'afternoon') return Sparkles;
  return Sunset;
}

function getPhaseCopy(phase: DayPhase, firstName: string, pendingTasks: number, pendingQuestions: number) {
  const name = firstName ? `, ${firstName}` : '';

  if (phase === 'morning') {
    return {
      eyebrow: 'Today flow',
      title: `Good morning${name}`,
      description: `Start calm and clear. You have ${pendingTasks} active tasks, ${pendingQuestions} pending questionnaires, and a chance to set the tone for your day in one tap.`,
      accent: 'A focused start',
    };
  }

  if (phase === 'afternoon') {
    return {
      eyebrow: 'Midday rhythm',
      title: `Good afternoon${name}`,
      description: `You’re in the middle of the day. The dashboard is tuned to balance momentum, check-ins, prayer timing, and anything that still needs attention.`,
      accent: 'Keep momentum steady',
    };
  }

  return {
    eyebrow: 'Wrap-up mode',
    title: `Good evening${name}`,
    description: `Close the day with confidence. Review what’s left, complete your check-in if needed, and leave with a clear sense of progress.`,
    accent: 'Finish with clarity',
  };
}

function formatPrayerTime(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(':');
  if (!hours || !minutes) return value;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return format(date, 'h:mm a');
}

function EmployeeDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pt-6">
      {children}
    </div>
  );
}

function LoadingFlowSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[260px] rounded-[28px] bg-white/[0.05]" />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <Skeleton className="h-[220px] rounded-[24px] bg-white/[0.05]" />
          <Skeleton className="h-[280px] rounded-[24px] bg-white/[0.05]" />
          <Skeleton className="h-[200px] rounded-[24px] bg-white/[0.05]" />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <Skeleton className="h-[320px] rounded-[24px] bg-white/[0.05]" />
          <Skeleton className="h-[180px] rounded-[24px] bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

function HeroBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
      {children}
    </span>
  );
}

function TodayFlowHero({
  eyebrow,
  title,
  description,
  accent,
  phaseIcon: PhaseIcon,
  heroBadges,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  phaseIcon: React.ComponentType<{ className?: string }>;
  heroBadges: string[];
  primaryAction: React.ReactNode;
  secondaryAction: React.ReactNode;
  tertiaryAction: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(20,184,166,0.18),rgba(139,92,246,0.14),rgba(11,16,32,0.98))] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.4)] md:p-8"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(139,92,246,0.18),transparent_28%)]"
        animate={{ opacity: [0.85, 1, 0.9] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      />

      <div className="relative grid gap-6 lg:grid-cols-[1.45fr_0.85fr] lg:items-end">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-teal-100">
                {eyebrow}
              </Badge>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-xs text-slate-200">
                <PhaseIcon className="h-3.5 w-3.5 text-teal-200" />
                {accent}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-white md:text-5xl">
                {title}
              </h1>
              <p className="max-w-[64ch] text-sm leading-6 text-slate-300 md:text-base">
                {description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {heroBadges.map((item) => (
              <HeroBadge key={item}>{item}</HeroBadge>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {primaryAction}
            {secondaryAction}
            {tertiaryAction}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur-md">
          {children}
        </div>
      </div>
    </motion.section>
  );
}

function NowActionPanel({
  action,
  condensed = false,
}: {
  action: ActionItem;
  condensed?: boolean;
}) {
  const content = (
    <section
      className={cn(
        'rounded-[24px] border p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5',
        action.urgent
          ? 'border-rose-400/25 bg-rose-400/[0.08] shadow-[0_0_0_1px_rgba(251,113,133,0.08)]'
          : 'border-teal-400/20 bg-white/5'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span
            className={cn(
              'inline-flex rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em]',
              action.urgent
                ? 'border border-rose-300/20 bg-rose-300/10 text-rose-100'
                : 'border border-amber-400/20 bg-amber-400/10 text-amber-100'
            )}
          >
            {action.label}
          </span>
          <div className="space-y-2">
            <h2 className={cn('font-semibold tracking-tight text-white', condensed ? 'text-lg' : 'text-xl md:text-2xl')}>
              {action.title}
            </h2>
            <p className={cn('max-w-[52ch] text-slate-300', condensed ? 'text-sm' : 'text-sm md:text-base')}>
              {action.description}
            </p>
          </div>
        </div>

        {!condensed ? (
          <div className={cn('hidden h-12 w-12 rounded-2xl md:block', action.urgent ? 'bg-rose-300/10' : 'bg-teal-400/10')} />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 pt-4">
        {action.href ? (
          <Button asChild className="h-11 rounded-full px-5 text-sm font-medium text-slate-950">
            <Link to={action.href}>
              {action.cta}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button className="h-11 rounded-full px-5 text-sm font-medium text-slate-950" onClick={action.onClick}>
            {action.cta}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        )}

        {!condensed ? (
          <Button variant="outline" className="h-11 rounded-full border-white/12 bg-white/[0.03] px-5 text-sm text-white hover:bg-white/[0.06]">
            View all actions
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 pt-4">
        {action.chips.map((chip) => (
          <span key={chip} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-slate-300">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );

  if (condensed) {
    return content;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.08, ease: 'easeOut' }}>
      {content}
    </motion.div>
  );
}

function TimelineAction({ item }: { item: TimelineItem }) {
  if (!item.cta) return null;

  if (item.href) {
    return (
      <Button asChild variant="ghost" className="h-auto px-0 text-xs text-slate-300 hover:bg-transparent hover:text-white">
        <Link to={item.href}>{item.cta}</Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" className="h-auto px-0 text-xs text-slate-300 hover:bg-transparent hover:text-white" onClick={item.onClick}>
      {item.cta}
    </Button>
  );
}

function DayTimelineRail({ items }: { items: TimelineItem[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.14, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/8 bg-slate-950/40 p-4 md:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Your day</h3>
          <p className="text-sm text-slate-400">A guided sequence of what needs attention next.</p>
        </div>
        <button className="text-sm text-slate-300 transition hover:text-white">Expand</button>
      </div>

      <div className="grid gap-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.04, duration: 0.2 }}
            className={cn(
              'group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border px-3 py-3 transition duration-200 hover:border-white/12 hover:bg-white/[0.05]',
              item.tone === 'urgent'
                ? 'border-amber-400/25 bg-amber-400/[0.08]'
                : item.tone === 'support'
                  ? 'border-violet-400/20 bg-violet-400/[0.06]'
                  : 'border-white/6 bg-white/[0.03]'
            )}
          >
            <motion.span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                item.tone === 'urgent' ? 'bg-amber-300' : item.tone === 'support' ? 'bg-violet-300' : 'bg-teal-400'
              )}
              animate={index === 0 ? { opacity: [1, 0.55, 1], scale: [1, 1.06, 1] } : undefined}
              transition={index === 0 ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <span className="text-xs text-slate-500">{item.time}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{item.description}</p>
            </div>
            <TimelineAction item={item} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function MomentumStrip({
  goalProgress,
  totalPoints,
  streak,
  rankLabel,
}: {
  goalProgress: number;
  totalPoints: number;
  streak: number;
  rankLabel: string;
}) {
  const tiles = [
    { label: 'Goals', value: `${goalProgress}%`, detail: 'Weekly progress is moving.' },
    { label: 'Momentum', value: `${streak} day streak`, detail: 'Consistency is compounding.' },
    { label: 'Recognition', value: `${Math.max(1, Math.floor(totalPoints / 120))} received`, detail: 'Signals from your teammates.' },
    { label: 'Standing', value: rankLabel, detail: 'Engagement snapshot for your cohort.' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.2, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 md:p-5"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Momentum</h3>
          <p className="text-sm text-slate-400">Progress without the noise.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-white/6 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{tile.label}</p>
            <p className="pt-2 text-2xl font-semibold text-white">{tile.value}</p>
            <p className="pt-1 text-sm text-slate-400">{tile.detail}</p>
            {tile.label === 'Goals' ? <Progress className="mt-4 h-2 bg-white/5" value={goalProgress} /> : null}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function AnnouncementStack({ announcements }: { announcements: Array<{ id: string; title: string; detail: string; critical?: boolean }> }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.24, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4 md:p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Relevant updates</h3>
          <p className="text-sm text-slate-400">Only what matters to your team and day.</p>
        </div>
        <Bell className="h-4 w-4 text-slate-400" />
      </div>

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <article
            key={announcement.id}
            className={cn(
              'rounded-2xl border p-4',
              announcement.critical
                ? 'border-violet-400/25 bg-violet-400/[0.08]'
                : 'border-white/6 bg-white/[0.025]'
            )}
          >
            <p className="text-sm font-medium text-white">{announcement.title}</p>
            <p className="pt-1 text-sm text-slate-300">{announcement.detail}</p>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function WellbeingDock({
  prayerLabel,
  reflection,
  onOpenSupport,
}: {
  prayerLabel: string;
  reflection: string;
  onOpenSupport: () => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.12, ease: 'easeOut' }}
      className="rounded-[24px] border border-violet-400/15 bg-[linear-gradient(180deg,rgba(23,32,51,0.96),rgba(17,24,39,0.92))] p-4 md:p-5"
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Prayer</p>
          <p className="pt-1 text-base font-medium text-white">{prayerLabel}</p>
          <p className="text-sm text-slate-400">Spiritual rhythm stays within reach.</p>
        </div>

        <div className="rounded-2xl bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Reflection</p>
          <p className="pt-2 text-sm text-slate-200">{reflection}</p>
        </div>

        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] p-4">
          <p className="text-sm font-medium text-white">Need support now?</p>
          <p className="pt-1 text-sm text-rose-100/80">Private crisis support is always available.</p>
          <button
            className="mt-3 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-medium text-slate-950 transition hover:scale-[0.985]"
            onClick={onOpenSupport}
          >
            Open support
          </button>
        </div>

        <Link to="/recognition/nominate" className="flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 transition hover:bg-white/[0.05]">
          <div>
            <p className="text-sm font-medium text-white">Send recognition</p>
            <p className="text-xs text-slate-400">Brighten someone’s day</p>
          </div>
          <Star className="h-4 w-4 text-slate-300" />
        </Link>
      </div>
    </motion.section>
  );
}

function SecondaryActionPanel({
  attendanceLabel,
  scheduleLabel,
  surveyCount,
}: {
  attendanceLabel: string;
  scheduleLabel: string;
  surveyCount: number;
}) {
  const items = [
    { icon: CalendarClock, title: 'Schedule', detail: scheduleLabel, href: '/employee/command-center?tab=calendar' },
    { icon: ClipboardList, title: 'Surveys', detail: `${surveyCount} pending questionnaires`, href: '/employee/survey' },
    { icon: CheckCheck, title: 'Attendance', detail: attendanceLabel, href: '/employee/command-center' },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.18, ease: 'easeOut' }}
      className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 md:p-5"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Secondary actions</h3>
        <p className="text-sm text-slate-400">Fast access to today’s other threads.</p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.title}
            to={item.href}
            className="flex items-center justify-between rounded-2xl border border-white/6 bg-white/[0.025] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.05]"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-teal-200">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

function QuickCaptureBar({ onCheckIn, onSupport }: { onCheckIn: () => void; onSupport: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.28 }}
        className="fixed bottom-4 right-4 z-30 hidden items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 backdrop-blur-xl shadow-2xl md:flex"
      >
        <button className="rounded-full bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-slate-950 transition active:scale-[0.985]" onClick={onCheckIn}>
          Check in
        </button>
        <Link to="/recognition/nominate" className="rounded-full bg-white/[0.06] px-4 py-2 text-sm text-white transition hover:bg-white/[0.1]">
          Recognition
        </Link>
        <button className="rounded-full bg-white/[0.06] px-4 py-2 text-sm text-white transition hover:bg-white/[0.1]" onClick={onSupport}>
          Support
        </button>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.28 }}
        className="fixed inset-x-4 bottom-4 z-30 rounded-full border border-white/10 bg-slate-900/85 px-4 py-3 text-sm font-medium text-white backdrop-blur-xl md:hidden"
        onClick={onCheckIn}
      >
        Open quick actions
      </motion.button>
    </>
  );
}

export default function EmployeeHome() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? arLocale : enUS;
  const phase = getDayPhase();
  const PhaseIcon = getPhaseIcon(phase);

  const { employee, isPending: employeeLoading } = useCurrentEmployee();
  const { streak = 0, totalPoints = 0, isPending: gamificationLoading } = useGamification(employee?.id ?? null);
  const { todayEntry } = useMoodHistory(employee?.id ?? null);
  const { pendingQuestions = [], surveyMeta, isPending: questionLoading } = useScheduledQuestions(employee?.id, undefined);
  const { tasks = [], isPending: tasksLoading } = useUnifiedTasks(employee?.id);
  const { rank, totalEmployees } = useEmployeeEngagementRank(employee?.id, employee?.tenant_id);

  const loading = employeeLoading || gamificationLoading || questionLoading || tasksLoading;

  const firstName = employee?.full_name?.split(' ')[0] ?? '';
  const activeTasks = useMemo(() => tasks.filter((task) => !['completed', 'archived'].includes(task.status)), [tasks]);
  const overdueTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activeTasks.filter((task) => task.due_date && task.due_date.split('T')[0] < today);
  }, [activeTasks]);

  const phaseCopy = getPhaseCopy(phase, firstName, activeTasks.length, pendingQuestions.length);
  const moodDone = Boolean(todayEntry);
  const nextPrayer = formatPrayerTime(null);

  const handleCheckIn = () => {
    const element = document.getElementById('inline-daily-checkin');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-[var(--brand-primary)]/40', 'ring-offset-2');
      setTimeout(() => element.classList.remove('ring-2', 'ring-[var(--brand-primary)]/40', 'ring-offset-2'), 1800);
      return;
    }

    toast.info('Open your daily check-in from the surveys and wellbeing flow.');
  };

  const handleSupport = () => {
    toast.info('Opening crisis support is available from the support module.');
  };

  const topAction: ActionItem = overdueTasks.length > 0
    ? {
        id: 'overdue',
        label: 'Priority now',
        title: `Resolve ${overdueTasks.length} overdue ${overdueTasks.length === 1 ? 'task' : 'tasks'}`,
        description: 'A quick pass through your overdue items will reduce the rest of the day’s pressure and reveal the real next step.',
        cta: 'Open my tasks',
        href: '/employee/command-center?tab=tasks',
        chips: ['Task flow', `${overdueTasks.length} overdue`, 'High urgency'],
        urgent: true,
      }
    : !moodDone
      ? {
          id: 'checkin',
          label: 'Priority now',
          title: 'Complete your daily check-in',
          description: 'It takes less than a minute and unlocks your mood trend, support recommendations, and better context for the rest of your day.',
          cta: 'Start check-in',
          onClick: handleCheckIn,
          chips: ['1 minute', 'Required today', 'Wellbeing'],
        }
      : pendingQuestions.length > 0
        ? {
            id: 'survey',
            label: 'Next best move',
            title: `Finish ${pendingQuestions.length} pending ${pendingQuestions.length === 1 ? 'survey' : 'surveys'}`,
            description: 'Your feedback is still waiting. Clearing questionnaires now keeps your day lighter later.',
            cta: 'Open surveys',
            href: '/employee/survey',
            chips: ['Questionnaires', surveyMeta?.schedule_name || 'Pending', 'Due soon'],
          }
        : activeTasks.length === 0
          ? {
              id: 'plan',
              label: 'Low-friction day',
              title: 'Shape the rest of your day intentionally',
              description: 'You’re clear on urgent work. Use this space to check goals, give recognition, or review your schedule before the next block begins.',
              cta: 'Review command center',
              href: '/employee/command-center',
              chips: ['Calm state', 'Progress review', 'Optional'],
            }
          : {
              id: 'focus',
              label: 'Now in focus',
              title: `Move your top ${Math.min(activeTasks.length, 3)} tasks forward`,
              description: 'Your workload is active but manageable. A focused sprint now will keep the rest of the day feeling light and controlled.',
              cta: 'Open my tasks',
              href: '/employee/command-center?tab=tasks',
              chips: ['Workload', `${activeTasks.length} active`, 'Focused'],
            };

  const dashboardMode: DashboardMode = loading
    ? 'loading'
    : topAction.urgent
      ? 'urgent'
      : activeTasks.length === 0 && pendingQuestions.length === 0 && moodDone
        ? 'empty'
        : 'active';

  const todayLabel = format(new Date(), 'EEEE, MMMM d', { locale });
  const prayerLabel = nextPrayer ? `Next prayer at ${nextPrayer}` : 'Prayer times available today';
  const attendanceLabel = moodDone ? 'Checked in and on track' : 'Check-in still pending';
  const scheduleLabel = phase === 'evening' ? 'End-of-day review window' : phase === 'afternoon' ? 'Midday workload block' : 'Morning work block';
  const reflection =
    dashboardMode === 'urgent'
      ? 'Take one urgent thing to completion before switching context.'
      : dashboardMode === 'empty'
        ? 'You have room today. Use it to invest in progress, kindness, or reflection.'
        : 'A small pause before the next task can reset the quality of the whole afternoon.';

  const timelineItems: TimelineItem[] = [
    {
      id: 'primary',
      time: 'Now',
      title: topAction.title,
      description: topAction.description,
      tone: topAction.urgent ? 'urgent' : 'default',
      cta: topAction.cta,
      href: topAction.href,
      onClick: topAction.onClick,
    },
    {
      id: 'survey',
      time: pendingQuestions.length > 0 ? 'Soon' : 'Later',
      title: pendingQuestions.length > 0 ? 'Questionnaire window still open' : 'No pending questionnaires',
      description: pendingQuestions.length > 0
        ? `${pendingQuestions.length} survey item${pendingQuestions.length > 1 ? 's' : ''} still need attention.`
        : 'Your survey queue is clear right now.',
      tone: pendingQuestions.length > 0 ? 'support' : 'default',
      cta: 'Open',
      href: '/employee/survey',
    },
    {
      id: 'prayer',
      time: nextPrayer ? 'Today' : 'Anytime',
      title: prayerLabel,
      description: 'Keep spiritual rhythm visible inside your workday.',
      tone: 'support',
      cta: 'Prayer space',
      href: '/spiritual/prayer-tracker',
    },
    {
      id: 'wrap',
      time: phase === 'evening' ? 'Before you leave' : 'Later today',
      title: phase === 'evening' ? 'Leave the day tidy' : 'Protect your afternoon energy',
      description: phase === 'evening'
        ? 'Review any unresolved items and leave tomorrow with a clearer starting point.'
        : 'Use your schedule and attendance view to avoid a rushed end to the day.',
      cta: 'View schedule',
      href: '/employee/command-center?tab=calendar',
    },
  ];

  const heroBadges = [
    todayLabel,
    attendanceLabel,
    activeTasks.length > 0 ? `${activeTasks.length} active tasks` : 'No active tasks',
    pendingQuestions.length > 0 ? `${pendingQuestions.length} pending surveys` : 'Survey queue clear',
  ];

  const announcements = [
    {
      id: 'team',
      title: phase === 'morning' ? 'Team pulse opens this morning' : 'Team pulse remains open',
      detail: 'A quick response helps your team stay visible without adding meeting overhead.',
      critical: pendingQuestions.length > 0,
    },
    {
      id: 'recognition',
      title: 'Recognition is one tap away',
      detail: 'Send a quick note of appreciation when someone makes your day easier.',
    },
  ];

  const goalProgress = Math.min(96, Math.max(18, streak * 8 + Math.min(activeTasks.length, 4) * 6));
  const rankLabel = rank && totalEmployees ? `#${rank} of ${totalEmployees}` : 'Building momentum';

  if (loading) {
    return (
      <div className="relative min-h-full bg-[var(--bg-canvas)]">
        <EmployeeDashboardShell>
          <LoadingFlowSkeleton />
        </EmployeeDashboardShell>
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-[var(--bg-canvas)] text-white">
      <EmployeeDashboardShell>
        <TodayFlowHero
          eyebrow={phaseCopy.eyebrow}
          title={phaseCopy.title}
          description={phaseCopy.description}
          accent={phaseCopy.accent}
          phaseIcon={PhaseIcon}
          heroBadges={heroBadges}
          primaryAction={
            topAction.href ? (
              <Button asChild className="h-11 rounded-full px-5 text-sm font-medium text-slate-950">
                <Link to={topAction.href}>{topAction.cta}</Link>
              </Button>
            ) : (
              <Button className="h-11 rounded-full px-5 text-sm font-medium text-slate-950" onClick={topAction.onClick}>
                {topAction.cta}
              </Button>
            )
          }
          secondaryAction={
            <Button variant="outline" className="h-11 rounded-full border-white/12 bg-white/[0.03] px-5 text-sm font-medium text-white hover:bg-white/[0.06]" onClick={handleCheckIn}>
              Check in
            </Button>
          }
          tertiaryAction={
            <Button asChild variant="outline" className="h-11 rounded-full border-white/12 bg-transparent px-5 text-sm font-medium text-slate-200 hover:bg-white/[0.04]">
              <Link to="/employee/command-center?tab=calendar">View schedule</Link>
            </Button>
          }
        >
          <NowActionPanel action={topAction} condensed />
        </TodayFlowHero>

        <div className="mt-6 grid gap-6 xl:grid-cols-12">
          <main className="space-y-6 xl:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={dashboardMode}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                <NowActionPanel action={topAction} />
                <DayTimelineRail items={timelineItems} />
                <MomentumStrip goalProgress={goalProgress} totalPoints={totalPoints} streak={streak} rankLabel={rankLabel} />
                <AnnouncementStack announcements={announcements} />
              </motion.div>
            </AnimatePresence>
          </main>

          <aside className="space-y-6 xl:col-span-4">
            <WellbeingDock prayerLabel={prayerLabel} reflection={reflection} onOpenSupport={handleSupport} />
            <SecondaryActionPanel
              attendanceLabel={attendanceLabel}
              scheduleLabel={scheduleLabel}
              surveyCount={pendingQuestions.length}
            />

            <Card className="rounded-[24px] border-white/8 bg-white/[0.03]">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/10 text-teal-200">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Goal focus</p>
                      <p className="text-xs text-slate-400">A light reminder of where you’re headed.</p>
                    </div>
                  </div>
                  <Progress value={goalProgress} className="h-2 bg-white/5" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Weekly progress</span>
                    <span className="font-medium text-white">{goalProgress}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-white/8 bg-white/[0.03]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-200">
                    <MoonStar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Human moments</p>
                    <p className="mt-1 text-sm text-slate-400">
                      This dashboard is designed to balance tasks, attention, care, and meaning throughout the day.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <QuickCaptureBar onCheckIn={handleCheckIn} onSupport={handleSupport} />

        <div id="inline-daily-checkin" className="mt-8 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-white">Daily check-in anchor</p>
              <p className="mt-1 text-sm text-slate-400">
                Your existing inline check-in experience can be mounted here to complete the dashboard flow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button className="h-10 rounded-full px-4 text-slate-950" onClick={() => toast.info('Mount the existing inline check-in component in this section.')}>
                <HeartHandshake className="mr-2 h-4 w-4" />
                Open check-in
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-full border-white/12 bg-transparent px-4 text-white hover:bg-white/[0.04]">
                <Link to="/crisis-support">
                  <Phone className="mr-2 h-4 w-4" />
                  Crisis support
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-10 rounded-full border-white/12 bg-transparent px-4 text-white hover:bg-white/[0.04]">
                <Link to="/crisis-support/first-aider">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  First aider
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </EmployeeDashboardShell>
    </div>
  );
}