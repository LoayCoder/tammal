import { useState } from 'react';
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
  Music,
  BookMarked,
  Calendar,
} from 'lucide-react';
import { DashboardPrayerWidget } from '@/components/dashboard/DashboardPrayerWidget';
import { DashboardIslamicCalendarWidget } from '@/components/dashboard/DashboardIslamicCalendarWidget';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BreathingGroundingTool from '@/components/mental-toolkit/tools/BreathingGroundingTool';
import JournalingPromptsTool from '@/components/mental-toolkit/practices/JournalingPromptsTool';
import HabitsPlanner from '@/components/mental-toolkit/practices/HabitsPlanner';
import SelfAssessmentQuiz from '@/components/mental-toolkit/resources/SelfAssessmentQuiz';
import MeditationLibraryTool from '@/components/mental-toolkit/practices/MeditationLibraryTool';
import PsychoeducationArticles from '@/components/mental-toolkit/resources/PsychoeducationArticles';
import IslamicCalendar from '@/pages/spiritual/IslamicCalendar';
import FirstAiderQuickConnect from '@/components/crisis/FirstAiderQuickConnect';

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
  const [openTool, setOpenTool] = useState<string | null>(null);

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
            <div onClick={() => setOpenTool('breathing')} className="cursor-pointer">
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
            </div>
            <div onClick={() => setOpenTool('journaling')} className="cursor-pointer">
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
            </div>
            <div onClick={() => setOpenTool('habits')} className="cursor-pointer">
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
            </div>
            <div onClick={() => setOpenTool('assessment')} className="cursor-pointer">
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
            </div>
          </div>
        </div>

        {/* Mental Health Tool Dialogs */}
        <Dialog open={openTool === 'breathing'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wind className="h-5 w-5 text-chart-3" />
                {t('home.breathingGrounding', 'Breathing & Grounding')}
              </DialogTitle>
            </DialogHeader>
            <BreathingGroundingTool onComplete={() => setOpenTool(null)} onCancel={() => setOpenTool(null)} />
          </DialogContent>
        </Dialog>

        <Dialog open={openTool === 'journaling'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-chart-4" />
                {t('home.dailyJournaling', 'Daily Journaling Prompts')}
              </DialogTitle>
            </DialogHeader>
            <JournalingPromptsTool />
          </DialogContent>
        </Dialog>

        <Dialog open={openTool === 'habits'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-chart-1" />
                {t('home.habitsPlanner', 'Positive Habits Planner')}
              </DialogTitle>
            </DialogHeader>
            <HabitsPlanner />
          </DialogContent>
        </Dialog>

        <Dialog open={openTool === 'assessment'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-chart-2" />
                {t('home.selfAssessment', 'Self-Assessment Quizzes')}
              </DialogTitle>
            </DialogHeader>
            <SelfAssessmentQuiz />
          </DialogContent>
        </Dialog>

        {/* Mental Health Resources Hub */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">{t('home.mentalHealthResources', 'Mental Health Resources')}</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div onClick={() => setOpenTool('meditation')} className="cursor-pointer">
              <Card className="glass-card border-0 ring-1 ring-primary/20 cursor-pointer transition-all hover:shadow-lg hover:ring-primary/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.meditationLibrary', 'Meditation Library')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.meditationLibraryDesc', 'Guided sessions for calm & focus')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </div>
            <div onClick={() => setOpenTool('articles')} className="cursor-pointer">
              <Card className="glass-card border-0 ring-1 ring-chart-5/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-5/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-5/10">
                    <BookMarked className="h-6 w-6 text-chart-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.psychoeducationArticles', 'Psychoeducation Articles')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.psychoeducationArticlesDesc', 'Learn about mental wellness')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </div>
            <div onClick={() => setOpenTool('calendar')} className="cursor-pointer">
              <Card className="glass-card border-0 ring-1 ring-chart-3/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-3/40">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-3/10">
                    <Calendar className="h-6 w-6 text-chart-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t('home.islamicCalendar', 'Islamic Calendar')}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t('home.islamicCalendarDesc', 'Hijri dates & Islamic events')}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Resource Dialogs */}
        <Dialog open={openTool === 'meditation'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                {t('home.meditationLibrary', 'Meditation Library')}
              </DialogTitle>
            </DialogHeader>
            <MeditationLibraryTool />
          </DialogContent>
        </Dialog>

        <Dialog open={openTool === 'articles'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-chart-5" />
                {t('home.psychoeducationArticles', 'Psychoeducation Articles')}
              </DialogTitle>
            </DialogHeader>
            <PsychoeducationArticles />
          </DialogContent>
        </Dialog>

        <Dialog open={openTool === 'calendar'} onOpenChange={(open) => !open && setOpenTool(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-chart-3" />
                {t('home.islamicCalendar', 'Islamic Calendar')}
              </DialogTitle>
            </DialogHeader>
            <IslamicCalendar />
          </DialogContent>
        </Dialog>

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
            <div onClick={() => setOpenTool('first-aider-connect')} className="cursor-pointer">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
