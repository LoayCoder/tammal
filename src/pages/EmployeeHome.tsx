import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useMoodHistory } from '@/hooks/wellness/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/questions/useScheduledQuestions';
import { InlineDailyCheckin } from '@/components/checkin/InlineDailyCheckin';
import {
  Flame,
  Star,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Calendar,
  Heart,
  ChevronRight,
  Phone,
  HeartHandshake,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

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
  const { employee, isLoading: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isLoading: gamLoading } = useGamification(employee?.id ?? null);
  const { moodData, avgMood7d, burnoutZone, monthlyCheckins, todayEntry, isLoading: moodLoading } =
    useMoodHistory(employee?.id ?? null);
  const { pendingQuestions, isLoading: sqLoading } = useScheduledQuestions(
    employee?.id,
    undefined
  );

  const isAr = i18n.language === 'ar';
  const firstName = employee?.full_name?.split(' ')[0] ?? '';

  const burnoutPercent = Math.round((avgMood7d / 5) * 100);

  const burnoutColor =
    burnoutZone === 'thriving'
      ? 'text-chart-1'
      : burnoutZone === 'watch'
        ? 'text-chart-4'
        : 'text-destructive';

  const burnoutBg =
    burnoutZone === 'thriving'
      ? 'bg-chart-1'
      : burnoutZone === 'watch'
        ? 'bg-chart-4'
        : 'bg-destructive';

  const chartData = moodData.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM'),
  }));

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
      {/* Gradient blobs handled by MainLayout */}

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

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="glass-stat border-0">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="text-2xl font-bold">{moodLoading ? '—' : monthlyCheckins}</div>
              <p className="text-muted-foreground text-xs">{t('home.monthlyCheckins')}</p>
            </CardContent>
          </Card>
          <Card className="glass-stat border-0">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-1/10">
                <TrendingUp className="h-5 w-5 text-chart-1" />
              </div>
              <div className="text-2xl font-bold">{moodLoading ? '—' : avgMood7d}</div>
              <p className="text-muted-foreground text-xs">{t('home.avgMood')}</p>
            </CardContent>
          </Card>
          <Card className="glass-stat border-0">
            <CardContent className="p-5 flex flex-col items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-chart-4/10">
                <Flame className="h-5 w-5 text-chart-4" />
              </div>
              <div className="text-2xl font-bold">{gamLoading ? '—' : streak}</div>
              <p className="text-muted-foreground text-xs">{t('home.currentStreak')}</p>
            </CardContent>
          </Card>
        </div>

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
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('home.moodHistory')}</CardTitle>
            <p className="text-muted-foreground text-xs">{t('home.last14Days')}</p>
          </CardHeader>
          <CardContent>
            {moodLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 5]}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card) / 0.6)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid hsl(var(--border) / 0.25)',
                      borderRadius: '8px',
                      fontSize: 12,
                      boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#moodGradient)"
                    dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Heart className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">{t('home.noMoodData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Burnout Indicator */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('home.burnout')}</CardTitle>
            <p className="text-muted-foreground text-xs">{t('home.burnoutPeriod')}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {moodLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${burnoutColor}`}>
                    {t(`home.${burnoutZone}`)}
                  </span>
                  <span className="text-muted-foreground">
                    {avgMood7d}/5
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/30">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${burnoutBg}`}
                    style={{ width: `${burnoutPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t('home.atRisk')}</span>
                  <span>{t('home.watch')}</span>
                  <span>{t('home.thriving')}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
