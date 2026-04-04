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
  Phone, HeartHandshake, Crown, ChevronDown, Clock,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { DashboardPrayerWidget } from '@/components/dashboard/DashboardPrayerWidget';

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
  const { pendingQuestions, surveyMeta, isPending: sqLoading } = useScheduledQuestions(employee?.id, undefined);
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className={typography.greeting}>
              {getGreeting(t)}{firstName ? <>, <span className={typography.vipName}>{firstName}</span></> : ''} 👋
            </h1>
            <Badge className="premium-badge gap-1 px-2.5 py-1 text-xs font-semibold">
              <Crown className="h-3 w-3 text-[hsl(var(--rank-gold))]" /> VIP
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground text-xs sm:text-sm truncate min-w-0">{t('home.subtitle')}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-0.5 rounded-full bg-muted/8 px-1.5 py-px">
                <Flame className="h-2.5 w-2.5 text-chart-4/70" />
                <span className="text-2xs font-semibold text-foreground">{gamLoading ? '...' : streak}</span>
                <span className="text-2xs text-muted-foreground">{t('home.dayStreak')}</span>
              </div>
              <div className="flex items-center gap-0.5 rounded-full bg-muted/8 px-1.5 py-px">
                <Star className="h-2.5 w-2.5 text-chart-1/70" />
                <span className="text-2xs font-semibold text-foreground">{gamLoading ? '...' : totalPoints}</span>
                <span className="text-2xs text-muted-foreground">{t('home.points')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Support Hub — Collapsible Premium Card */}
        <Collapsible className="premium-card rounded-2xl hover:shadow-sm transition-all duration-200">
          <CollapsibleTrigger className="group flex items-center justify-between w-full p-4 cursor-pointer">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-bold text-foreground">{t('dashboard.quickActions')}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/crisis-support">
                <div className="flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 cursor-pointer transition-all duration-200 bg-destructive/[0.04] hover:bg-destructive/[0.08] hover:shadow-sm hover:-translate-y-0.5">
                  <Phone className="h-5 w-5 text-destructive" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-center leading-tight">{t('crisisSupport.nav.crisisSupport')}</span>
                </div>
              </Link>
              <div onClick={() => setShowFirstAider(true)} className="cursor-pointer">
                <div className="flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 transition-all duration-200 bg-chart-1/[0.04] hover:bg-chart-1/[0.08] hover:shadow-sm hover:-translate-y-0.5">
                  <HeartHandshake className="h-5 w-5 text-chart-1" strokeWidth={1.5} />
                  <span className="text-xs font-medium text-center leading-tight">{t('crisisSupport.nav.firstAider')}</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Pending Endorsement Requests */}
        <DashboardEndorsementRequests />

        {/* Shortlisted Acknowledgment */}
        <DashboardShortlistWidget />

        {/* Voting Booth Widget */}
        <DashboardVotingWidget />

        {/* Pending Surveys Card */}
        {(sqLoading || pendingQuestions.length > 0) && (
          <Link to="/employee/survey" className="block">
            <Card className={cn(cardVariants.premiumVip, "rounded-2xl cursor-pointer hover:shadow-md transition-all duration-200")}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-chart-2/10 to-chart-2/5">
                  <ClipboardList className="h-7 w-7 text-chart-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">
                      {surveyMeta?.schedule_name || t('home.surveyCard')}
                    </h3>
                    {!sqLoading && pendingQuestions.length > 0 && (
                      <Badge variant="secondary" className="text-2xs px-1.5 py-0">{pendingQuestions.length}</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    {sqLoading ? '...' : t('home.pendingSurveys', { count: pendingQuestions.length })}
                  </p>
                  {surveyMeta?.end_date && (() => {
                    const daysLeft = differenceInDays(new Date(surveyMeta.end_date), new Date());
                    const isUrgent = daysLeft <= 2;
                    return (
                      <p className={cn("text-xs mt-1 flex items-center gap-1", isUrgent ? "text-chart-4 font-medium" : "text-muted-foreground")}>
                        <Clock className="h-3 w-3" />
                        {t('home.dueDate', { date: format(new Date(surveyMeta.end_date), 'MMM d, yyyy') })}
                        {isUrgent && daysLeft >= 0 && ` · ${daysLeft}d left`}
                      </p>
                    );
                  })()}
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
              </CardContent>
            </Card>
          </Link>
        )}

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
        

        {/* Workload Overview Widget */}
        {employee && <DashboardWorkloadWidget employeeId={employee.id} />}


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

      </div>
    </div>
  );
}
