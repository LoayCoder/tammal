import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/questions/useScheduledQuestions';
import { InlineDailyCheckin } from '@/components/checkin/InlineDailyCheckin';
import { PersonalMoodDashboard } from '@/components/dashboard/PersonalMoodDashboard';
import { MentalHealthToolsHub } from '@/components/dashboard/MentalHealthToolsHub';
import { MentalHealthResourcesHub } from '@/components/dashboard/MentalHealthResourcesHub';
import {
  Flame, Star, CheckCircle2, ClipboardList, ChevronRight,
  Phone, HeartHandshake, Crown,
} from 'lucide-react';
import { DashboardPrayerWidget } from '@/components/dashboard/DashboardPrayerWidget';
import { DashboardIslamicCalendarWidget } from '@/components/dashboard/DashboardIslamicCalendarWidget';
import { DashboardWorkloadWidget } from '@/components/dashboard/DashboardWorkloadWidget';
import FirstAiderQuickConnect from '@/components/crisis/FirstAiderQuickConnect';
import { DashboardEndorsementRequests } from '@/components/dashboard/DashboardEndorsementRequests';
import { DashboardShortlistWidget } from '@/components/dashboard/DashboardShortlistWidget';
import { DashboardVotingWidget } from '@/components/dashboard/DashboardVotingWidget';
import { cardVariants, typography } from "@/theme/tokens";
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
  const { t } = useTranslation();
  const { employee, isPending: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isPending: gamLoading } = useGamification(employee?.id ?? null);
  const { todayEntry } = useMoodHistory(employee?.id ?? null);
  const { pendingQuestions, isPending: sqLoading } = useScheduledQuestions(employee?.id, undefined);
  const [showFirstAider, setShowFirstAider] = useState(false);

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
    <div className="relative min-h-full premium-bg">
      <div className="relative space-y-8">
        {/* Greeting + VIP Badge */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className={typography.greeting}>
              {getGreeting(t)}{firstName ? <>, <span className={typography.vipName}>{firstName}</span></> : ''} 👋
            </h1>
            <Badge className="premium-badge gap-1 px-2.5 py-1 text-xs font-semibold">
              <Crown className="h-3 w-3 text-amber-500" /> VIP
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{t('home.subtitle')}</p>
        </div>

        {/* Gamification Badges */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="premium-badge gap-1.5 px-3.5 py-1.5 text-sm font-medium">
            <Flame className="h-4 w-4 text-chart-4 drop-shadow-sm" />
            {gamLoading ? '...' : streak} {t('home.dayStreak')}
          </Badge>
          <Badge variant="secondary" className="premium-badge gap-1.5 px-3.5 py-1.5 text-sm font-medium">
            <Star className="h-4 w-4 text-chart-1 drop-shadow-sm" />
            {gamLoading ? '...' : totalPoints} {t('home.points')}
          </Badge>
        </div>

        {/* Pending Endorsement Requests */}
        <DashboardEndorsementRequests />

        {/* Shortlisted Acknowledgment */}
        <DashboardShortlistWidget />

        {/* Voting Booth Widget */}
        <DashboardVotingWidget />

        {/* Inline Daily Check-in */}
        {employee && !todayEntry && employee.user_id && (
          <InlineDailyCheckin employeeId={employee.id} tenantId={employee.tenant_id} userId={employee.user_id} />
        )}

        {/* Completed check-in indicator */}
        {todayEntry && (
          <Card className={cn(cardVariants.premiumVip)}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1/15 to-chart-1/5 text-2xl">
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

        {/* Spiritual Wellbeing Widgets */}
        <DashboardPrayerWidget />
        <DashboardIslamicCalendarWidget />

        {/* Workload Overview Widget */}
        {employee && <DashboardWorkloadWidget employeeId={employee.id} />}

        {/* Pending Surveys Card */}
        {(sqLoading || pendingQuestions.length > 0) && (
          <Link to="/employee/survey">
            <Card className={cn(cardVariants.premium, "cursor-pointer")}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2/15 to-chart-2/5">
                  <ClipboardList className="h-7 w-7 text-chart-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base">{t('home.surveyCard')}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {sqLoading ? '...' : t('home.pendingSurveys', { count: pendingQuestions.length })}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Mental Health Tools Hub */}
        <MentalHealthToolsHub />

        {/* Mental Health Resources Hub */}
        <MentalHealthResourcesHub />

        {/* First Aider Quick Connect */}
        <FirstAiderQuickConnect
          open={showFirstAider}
          onOpenChange={setShowFirstAider}
          tenantId={employee?.tenant_id}
        />

        {/* Personal Mood Dashboard */}
        <PersonalMoodDashboard />

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className={typography.sectionTitle}>{t('dashboard.quickActions')}</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Link to="/crisis-support">
              <Card className={cn(cardVariants.premium, "cursor-pointer")}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-destructive/15 to-destructive/5">
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
            <div onClick={() => setShowFirstAider(true)} className="cursor-pointer">
              <Card className={cn(cardVariants.premium, "cursor-pointer")}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-1/15 to-chart-1/5">
                    <HeartHandshake className="h-6 w-6 text-chart-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('crisisSupport.nav.firstAider')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('dashboard.firstAiderDesc')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
