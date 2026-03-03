import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/questions/useScheduledQuestions';
import { InlineDailyCheckin } from '@/components/checkin/InlineDailyCheckin';
import { PersonalMoodDashboard } from '@/components/dashboard/PersonalMoodDashboard';
import {
  Flame,
  Star,
  CheckCircle2,
  ClipboardList,
  ChevronRight,
  Phone,
  HeartHandshake,
  Wind,
  BookOpen,
  CheckSquare,
  ClipboardCheck,
} from 'lucide-react';
import { DashboardPrayerWidget } from '@/components/dashboard/DashboardPrayerWidget';
import { DashboardIslamicCalendarWidget } from '@/components/dashboard/DashboardIslamicCalendarWidget';

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

export default function EmployeeHome() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isPending: gamLoading } = useGamification(employee?.id ?? null);
  const { todayEntry, isPending: moodLoading } = useMoodHistory(employee?.id ?? null);
  const { pendingQuestions, isPending: sqLoading } = useScheduledQuestions(
    employee?.id,
    undefined
  );

  const firstName = employee?.full_name?.split(' ')[0] ?? '';

  if (empLoading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <div className="relative space-y-6">
        {/* Greeting */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {getGreeting(t)}{firstName ? `, ${firstName}` : ''} 👋
          </h1>
          <p className="text-muted-foreground text-sm">{t('home.subtitle')}</p>
        </div>

        {/* Gamification Badges */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="glass-badge gap-1.5 px-3 py-1.5 text-sm">
            <Flame className="h-4 w-4 text-chart-4" />
            {gamLoading ? '...' : streak} {t('home.dayStreak')}
          </Badge>
          <Badge variant="secondary" className="glass-badge gap-1.5 px-3 py-1.5 text-sm">
            <Star className="h-4 w-4 text-chart-1" />
            {gamLoading ? '...' : totalPoints} {t('home.points')}
          </Badge>
        </div>

        {/* Inline Daily Check-in */}
        {employee && !todayEntry && employee.user_id && (
          <InlineDailyCheckin employeeId={employee.id} tenantId={employee.tenant_id} userId={employee.user_id} />
        )}

        {/* Completed check-in indicator */}
        {todayEntry && (
          <Card className="glass-card border-0 ring-1 ring-chart-1/20">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-1/10 text-2xl">
                {MOOD_EMOJIS[todayEntry.level] || '✅'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{t('home.checkinDone')}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">{t('home.checkinDoneDesc')}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-chart-1 shrink-0" />
            </CardContent>
          </Card>
        )}

        {/* Pending Surveys Card */}
        {(sqLoading || pendingQuestions.length > 0) && (
          <Card
            className="glass-card border-0 ring-1 ring-chart-2/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-2/40"
            onClick={() => navigate('/employee/survey')}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-2/10">
                <ClipboardList className="h-7 w-7 text-chart-2" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{t('home.surveyCard')}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {sqLoading
                    ? '...'
                    : t('home.pendingSurveys', { count: pendingQuestions.length })}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
            </CardContent>
          </Card>
        )}

        {/* Spiritual Wellbeing Widgets */}
        <DashboardPrayerWidget />
        <DashboardIslamicCalendarWidget />

        {/* Mental Health Tools Hub */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('home.mentalHealthTools', 'Mental Health Tools')}</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Link to="/mental-toolkit/breathing">
              <Card className="glass-card border-0 ring-1 ring-chart-3/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-3/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-3/10">
                    <Wind className="h-6 w-6 text-chart-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.breathingGrounding', 'Breathing & Grounding')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.breathingGroundingDesc', 'Calm your mind with guided exercises')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/mental-toolkit/journaling">
              <Card className="glass-card border-0 ring-1 ring-chart-4/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-4/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-4/10">
                    <BookOpen className="h-6 w-6 text-chart-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.dailyJournaling', 'Daily Journaling Prompts')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.dailyJournalingDesc', 'Reflect and express your thoughts')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/mental-toolkit/habits">
              <Card className="glass-card border-0 ring-1 ring-chart-1/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-1/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-1/10">
                    <CheckSquare className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.habitsPlanner', 'Positive Habits Planner')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.habitsPlannerDesc', 'Build healthy daily routines')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/mental-toolkit/assessment">
              <Card className="glass-card border-0 ring-1 ring-chart-2/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-2/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-2/10">
                    <ClipboardCheck className="h-6 w-6 text-chart-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.selfAssessment', 'Self-Assessment Quizzes')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.selfAssessmentDesc', 'Check in on your wellbeing')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* ── Personal Mood Dashboard (rich analytics) ── */}
        <PersonalMoodDashboard />

        {/* Quick Actions */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('dashboard.quickActions')}</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Link to="/crisis-support">
              <Card className="glass-card border-0 ring-1 ring-destructive/20 cursor-pointer transition-all hover:shadow-lg hover:ring-destructive/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10">
                    <Phone className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('crisisSupport.nav.crisisSupport')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('dashboard.crisisSupportDesc')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </Link>
            <Link to="/first-aider">
              <Card className="glass-card border-0 ring-1 ring-chart-1/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-1/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-1/10">
                    <HeartHandshake className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('crisisSupport.nav.firstAider')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('dashboard.firstAiderDesc')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
