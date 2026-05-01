import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/questions/useScheduledQuestions';
import { InlineDailyCheckin } from '@/components/checkin/InlineDailyCheckin';
import { PersonalMoodDashboard } from '@/components/dashboard/PersonalMoodDashboard';
import {
  Flame, Star, CheckCircle2, ClipboardList, ChevronRight,
  Phone, HeartHandshake, Crown, Clock, Sparkles, ArrowRight, ShieldCheck,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale/ar';
import { enUS } from 'date-fns/locale/en-US';
import { DashboardPrayerWidget } from '@/components/dashboard/DashboardPrayerWidget';

import { DashboardWorkloadWidget } from '@/components/dashboard/DashboardWorkloadWidget';
import { DashboardTodoWidget } from '@/components/dashboard/DashboardTodoWidget';
import FirstAiderQuickConnect from '@/components/crisis/FirstAiderQuickConnect';
import { DashboardEndorsementRequests } from '@/components/dashboard/DashboardEndorsementRequests';
import { DashboardShortlistWidget } from '@/components/dashboard/DashboardShortlistWidget';
import { DashboardVotingWidget } from '@/components/dashboard/DashboardVotingWidget';
import { WellnessCopilotCard } from '@/features/wellness-copilot';
import { TeamPulseCard, QuickAppreciationCard, AppreciationActivityWidget } from '@/features/team-pulse';
import { EngagementRankBadge } from '@/components/dashboard/EngagementRankBadge';
import { useEmployeeEngagementRank } from '@/hooks/wellness/useEmployeeEngagementRank';
import { cardVariants, layout, typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

const MOOD_EMOJIS: Record<string, string> = {
  great: '😄', good: '🙂', okay: '😐', bad: '😟', terrible: '😢',
};

function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.goodMorning');
  if (hour < 18) return t('home.goodAfternoon');
  return t('home.goodEvening');
}

export default function EmployeeHome() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ar' ? arLocale : enUS;
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isPending: gamLoading } = useGamification(employee?.id ?? null);
  const { todayEntry } = useMoodHistory(employee?.id ?? null);
  const { pendingQuestions, surveyMeta, isPending: sqLoading } = useScheduledQuestions(employee?.id, undefined);
  const [showFirstAider, setShowFirstAider] = useState(false);
  const { rank, totalEmployees, isPending: rankLoading, error: rankError } = useEmployeeEngagementRank(employee?.id, employee?.tenant_id);

  const handleCheckinClick = useCallback(() => {
    const el = document.getElementById('inline-daily-checkin');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-destructive/50', 'ring-offset-2');
      setTimeout(() => el.classList.remove('ring-2', 'ring-destructive/50', 'ring-offset-2'), 2000);
    } else {
      toast.info(t('home.checkinDone'));
    }
  }, [t]);

  const firstName = employee?.full_name?.split(' ')[0] ?? '';

  if (empLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <Skeleton className="h-80 rounded-2xl xl:col-span-8" />
          <Skeleton className="h-80 rounded-2xl xl:col-span-4" />
        </div>
      </div>
    );
  }

  const heroContext = [employee?.role_title, employee?.department].filter(Boolean).join(' • ');
  const dayFocus = todayEntry
    ? t('home.checkinDoneDesc')
    : pendingQuestions.length > 0
      ? t('home.pendingSurveys', { count: pendingQuestions.length })
      : t('home.subtitle');

  const metricCards = [
    {
      label: t('home.dayStreak'),
      value: gamLoading ? '...' : streak,
      delta: t('home.points'),
      detail: t('home.subtitle'),
      icon: Flame,
      tone: 'bg-[var(--chart-4)]/10 text-[var(--chart-4)]',
    },
    {
      label: t('home.points'),
      value: gamLoading ? '...' : totalPoints,
      delta: t('home.keepEngaging'),
      detail: t('home.subtitle'),
      icon: Star,
      tone: 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]',
    },
    {
      label: t('home.surveyCard'),
      value: sqLoading ? '...' : pendingQuestions.length,
      delta: pendingQuestions.length > 0 ? t('dashboard.quickActions') : t('common.done'),
      detail: surveyMeta?.schedule_name || t('home.pendingSurveys', { count: pendingQuestions.length }),
      icon: ClipboardList,
      tone: 'bg-[var(--chart-2)]/10 text-[var(--chart-2)]',
    },
    {
      label: t('home.checkinDone'),
      value: todayEntry ? (MOOD_EMOJIS[todayEntry.level] || '✅') : '—',
      delta: todayEntry ? t('common.done') : t('home.goodMorning'),
      detail: todayEntry ? t('home.checkinDoneDesc') : t('mentalToolkit.moodDashboard.notCheckedIn'),
      icon: CheckCircle2,
      tone: 'bg-[var(--chart-6)]/10 text-[var(--chart-6)]',
    },
  ];

  return (
    <div className="relative min-h-full premium-bg">
      <div className="relative space-y-4">
        <div className={layout.dashboardGrid}>
          <Card className={cn(cardVariants.premiumVip, "xl:col-span-8 overflow-hidden")}>
            <CardContent className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="premium-badge gap-1 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]">
                      <Crown className="h-3 w-3 text-[hsl(var(--rank-gold))]" />
                      Employee Command Center
                    </Badge>
                    {heroContext && (
                      <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                        {heroContext}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h1 className={typography.greeting}>
                      {getGreeting(t)}{firstName ? <>, <span className={typography.vipName}>{firstName}</span></> : ''} 👋
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                      {dayFocus}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                      <p className={typography.statLabel}>Today’s focus</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {pendingQuestions.length > 0 ? t('home.surveyCard') : t('dashboard.quickActions')}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{dayFocus}</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                      <p className={typography.statLabel}>Wellbeing status</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                        {todayEntry ? t('common.done') : t('mentalToolkit.moodDashboard.notCheckedIn')}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {todayEntry ? t('home.checkinDoneDesc') : t('home.subtitle')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                      <p className={typography.statLabel}>Support lane</p>
                      <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{t('dashboard.quickActions')}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{t('crisisSupport.nav.firstAider')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[280px] gap-3 sm:grid-cols-2 lg:w-[320px] lg:grid-cols-1">
                  <Button className="h-11 justify-between rounded-xl bg-[var(--brand-primary)] px-4 text-slate-950 hover:bg-[var(--brand-primary-hover)]" onClick={handleCheckinClick}>
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {todayEntry ? t('home.checkinDone') : t('home.goodMorning')}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="h-11 justify-between rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]" asChild>
                    <Link to="/crisis-support">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {t('crisisSupport.nav.crisisSupport')}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" className="h-11 justify-between rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]" onClick={() => setShowFirstAider(true)}>
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      {t('crisisSupport.nav.firstAider')}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(cardVariants.elevated, "xl:col-span-4")}>
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className={typography.statLabel}>Today</p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Action rail</h2>
                </div>
                <Badge variant="outline" className="rounded-full border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                  {pendingQuestions.length + (todayEntry ? 0 : 1)} open
                </Badge>
              </div>

              <div className="space-y-3">
                <Link to="/employee/survey" className="block rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition hover:bg-[var(--bg-surface-hover)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--chart-2)]/10 text-[var(--chart-2)]">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{surveyMeta?.schedule_name || t('home.surveyCard')}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{sqLoading ? '...' : t('home.pendingSurveys', { count: pendingQuestions.length })}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-[var(--text-muted)] rtl:rotate-180" />
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={handleCheckinClick}
                  className="block w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left transition hover:bg-[var(--bg-surface-hover)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--chart-6)]/10 text-[var(--chart-6)]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{todayEntry ? t('home.checkinDone') : t('mentalToolkit.moodDashboard.notCheckedIn')}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{todayEntry ? t('home.checkinDoneDesc') : t('home.subtitle')}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-[var(--text-muted)] rtl:rotate-180" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFirstAider(true)}
                  className="block w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left transition hover:bg-[var(--bg-surface-hover)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                      <HeartHandshake className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{t('dashboard.quickActions')}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{t('crisisSupport.nav.firstAider')}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 text-[var(--text-muted)] rtl:rotate-180" />
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((card) => (
            <Card key={card.label} className={cardVariants.elevated}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={typography.statLabel}>{card.label}</p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className={typography.metric}>{card.value}</p>
                    </div>
                  </div>
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", card.tone)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[var(--text-secondary)]">{card.delta}</span>
                  <span className="truncate text-[var(--text-muted)]">{card.detail}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <EngagementRankBadge rank={rank} totalEmployees={totalEmployees} isPending={rankLoading} error={rankError} />

        {employee && !todayEntry && employee.user_id && (
          <InlineDailyCheckin employeeId={employee.id} tenantId={employee.tenant_id} userId={employee.user_id} />
        )}

        {todayEntry && (
          <Card className={cn(cardVariants.surface, "border-[var(--chart-6)]/20")}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--chart-6)]/10 text-2xl">
                {MOOD_EMOJIS[todayEntry.level] || '✅'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('home.checkinDone')}</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{t('home.checkinDoneDesc')}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[var(--chart-6)] shrink-0" />
            </CardContent>
          </Card>
        )}

        <div className={layout.dashboardGrid}>
          <div className="space-y-4 xl:col-span-4">
            {employee && <DashboardTodoWidget employeeId={employee.id} tenantId={employee.tenant_id} />}
            <DashboardEndorsementRequests />
          </div>

          <div className="space-y-4 xl:col-span-4">
            {employee && <DashboardWorkloadWidget employeeId={employee.id} />}
            <DashboardVotingWidget />
          </div>

          <div className="space-y-4 xl:col-span-4">
            <DashboardPrayerWidget />
            <DashboardShortlistWidget />
          </div>
        </div>

        <div className={layout.dashboardGrid}>
          <div className="space-y-4 xl:col-span-8">
            <PersonalMoodDashboard />
            {employee && <AppreciationActivityWidget mode="personal" />}
          </div>

          <div className="space-y-4 xl:col-span-4">
            {employee && <WellnessCopilotCard employeeId={employee.id} onCheckinClick={handleCheckinClick} />}
            <QuickAppreciationCard />
            {employee && <TeamPulseCard employeeId={employee.id} />}
          </div>
        </div>

        <FirstAiderQuickConnect
          open={showFirstAider}
          onOpenChange={setShowFirstAider}
          tenantId={employee?.tenant_id}
        />
      </div>
    </div>
  );
}
