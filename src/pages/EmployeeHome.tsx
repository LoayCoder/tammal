import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useGamification } from '@/hooks/useGamification';
import { useMoodHistory } from '@/hooks/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/useScheduledQuestions';
import {
  Flame,
  Star,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Calendar,
  Heart,
  ChevronRight,
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

  const burnoutPercent =
    burnoutZone === 'thriving' ? 85 : burnoutZone === 'watch' ? 55 : 25;

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
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {getGreeting(t)}{firstName ? `, ${firstName}` : ''} 👋
        </h1>
        <p className="text-muted-foreground text-sm">{t('home.subtitle')}</p>
      </div>

      {/* Gamification Badges */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Flame className="h-4 w-4 text-chart-4" />
          {gamLoading ? '...' : streak} {t('home.dayStreak')}
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Star className="h-4 w-4 text-chart-1" />
          {gamLoading ? '...' : totalPoints} {t('home.points')}
        </Badge>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Check-in Card */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
            todayEntry
              ? 'border-chart-1/30 bg-chart-1/5'
              : 'border-primary/30 bg-primary/5 hover:border-primary/50'
          }`}
          onClick={() => !todayEntry && navigate('/employee/wellness')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                todayEntry ? 'bg-chart-1/10' : 'bg-primary/10'
              }`}
            >
              {todayEntry ? (
                MOOD_EMOJIS[todayEntry.level] || '✅'
              ) : (
                <Heart className="h-7 w-7 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base">
                {todayEntry ? t('home.checkinDone') : t('home.checkinCard')}
              </h3>
              <p className="text-muted-foreground text-sm mt-0.5">
                {todayEntry ? t('home.checkinDoneDesc') : t('home.checkinDesc')}
              </p>
            </div>
            {!todayEntry && (
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
            )}
            {todayEntry && (
              <CheckCircle2 className="h-6 w-6 text-chart-1 shrink-0" />
            )}
          </CardContent>
        </Card>

        {/* Pending Surveys Card */}
        {(sqLoading || pendingQuestions.length > 0) && (
          <Card
            className="cursor-pointer transition-all hover:shadow-lg border-2 border-chart-2/30 bg-chart-2/5 hover:border-chart-2/50"
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
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{moodLoading ? '—' : monthlyCheckins}</div>
            <p className="text-muted-foreground text-xs mt-0.5">{t('home.monthlyCheckins')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <div className="text-2xl font-bold">{moodLoading ? '—' : avgMood7d}</div>
            <p className="text-muted-foreground text-xs mt-0.5">{t('home.avgMood')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Flame className="h-5 w-5 mx-auto text-chart-4 mb-1" />
            <div className="text-2xl font-bold">{gamLoading ? '—' : streak}</div>
            <p className="text-muted-foreground text-xs mt-0.5">{t('home.currentStreak')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood History Chart */}
      <Card>
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
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('home.burnout')}</CardTitle>
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
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/20">
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
  );
}
