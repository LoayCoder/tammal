import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useGamification } from '@/hooks/useGamification';
import { useMoodHistory } from '@/hooks/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/useScheduledQuestions';
import { InlineDailyCheckin } from '@/components/checkin/InlineDailyCheckin';
import { ZenInsightCarousel } from '@/components/home/ZenInsightCarousel';
import { Flame, Star, ClipboardList, ChevronRight } from 'lucide-react';

/* ── constants ─────────────────────────────────────────── */

const MOOD_EMOJIS: Record<string, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  bad: '😟',
  terrible: '😢',
};

function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.goodMorning');
  if (hour < 18) return t('home.goodAfternoon');
  return t('home.goodEvening');
}

/* ══════════════════════════════════════════════════════════
   EmployeeHome – Zen Night layout
   ══════════════════════════════════════════════════════════ */

export default function EmployeeHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employee, isLoading: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isLoading: gamLoading } = useGamification(employee?.id ?? null);
  const { moodData, avgMood7d, burnoutZone, todayEntry, isLoading: moodLoading } =
    useMoodHistory(employee?.id ?? null);
  const { pendingQuestions, isLoading: sqLoading } = useScheduledQuestions(employee?.id, undefined);

  const firstName = employee?.full_name?.split(' ')[0] ?? '';
  const moodEmoji = todayEntry ? (MOOD_EMOJIS[todayEntry.level] || '✅') : null;

  // Survey progress (rough % from answered count)
  const surveyTotal = pendingQuestions.length;
  const hasDraft = false; // placeholder — real draft detection requires response check

  /* ── loading skeleton ─────────────────────────────────── */
  if (empLoading) {
    return (
      <div className="space-y-5 px-4 pt-6 pb-20">
        <Skeleton className="h-10 w-3/4 rounded-xl" />
        <Skeleton className="h-52 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen px-4 pt-6 pb-20 space-y-5"
      style={{ background: 'hsl(222 47% 11%)' }}
    >
      {/* ═══ A. Smart Header ═══ */}
      <div className="flex items-center justify-between zen-stagger-1">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: 'hsl(210 40% 98%)' }}>
            {getGreeting(t)}{firstName ? `, ${firstName}` : ''}
          </h1>
          {moodEmoji && <span className="text-xl">{moodEmoji}</span>}
        </div>

        {/* Status Pill */}
        <div
          className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-full"
          style={{
            background: 'hsl(217 33% 17% / 0.8)',
            border: '1px solid hsl(215 20% 65% / 0.15)',
          }}
        >
          <Flame className="h-3.5 w-3.5" style={{ color: 'hsl(25 95% 53%)' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(210 40% 98%)' }}>
            {gamLoading ? '…' : `${streak} ${t('home.dayStreak')}`}
          </span>
          <span className="text-xs" style={{ color: 'hsl(215 25% 60%)' }}>•</span>
          <Star className="h-3.5 w-3.5" style={{ color: 'hsl(259 67% 67%)' }} />
          <span className="text-xs font-semibold" style={{ color: 'hsl(210 40% 98%)' }}>
            {gamLoading ? '…' : `${totalPoints} ${t('home.points')}`}
          </span>
        </div>
      </div>

      {/* ═══ B. Hero Check-in Card ═══ */}
      {employee && !todayEntry && employee.user_id && (
        <div className="zen-stagger-2 zen-card p-6">
          <InlineDailyCheckin
            employeeId={employee.id}
            tenantId={employee.tenant_id}
            userId={employee.user_id}
          />
        </div>
      )}

      {/* Post-check-in summary card */}
      {todayEntry && (
        <div className="zen-stagger-2 zen-card p-6 flex items-center gap-4">
          <span className="text-4xl">{moodEmoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'hsl(210 40% 98%)' }}>
              {t('home.heroDoneTitle')}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(215 25% 72%)' }}>
              {t('home.heroDoneSubtitle')}
            </p>
          </div>
        </div>
      )}

      {/* ═══ C. Survey Card (Conditional) ═══ */}
      {!sqLoading && surveyTotal > 0 && (
        <div
          className="zen-stagger-3 zen-card p-5 cursor-pointer transition-all hover:ring-1"
          style={{ '--tw-ring-color': 'hsl(259 67% 67% / 0.3)' } as React.CSSProperties}
          onClick={() => navigate('/employee/survey')}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'hsl(259 67% 67% / 0.15)' }}
            >
              <ClipboardList className="h-6 w-6" style={{ color: 'hsl(259 67% 67%)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm" style={{ color: 'hsl(210 40% 98%)' }}>
                {t('home.surveyCard')}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(215 25% 72%)' }}>
                {t('home.pendingSurveys', { count: surveyTotal })}
              </p>
              {hasDraft && (
                <div className="mt-2">
                  <Progress value={40} className="h-1" />
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 gap-1 text-xs font-semibold"
              style={{ color: 'hsl(259 67% 67%)' }}
            >
              {hasDraft ? t('home.resumeSurvey') : t('home.startSurvey')}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* ═══ D. Insight Carousel ═══ */}
      {!moodLoading && (
        <div className="zen-stagger-4 zen-card p-5">
          <ZenInsightCarousel
            moodData={moodData}
            streak={streak}
            avgMood7d={avgMood7d}
            burnoutZone={burnoutZone}
          />
        </div>
      )}
    </div>
  );
}
