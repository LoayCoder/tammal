import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { useGamification } from '@/hooks/useGamification';
import { useMoodHistory } from '@/hooks/useMoodHistory';
import { useScheduledQuestions } from '@/hooks/useScheduledQuestions';
import { InlineDailyCheckin } from '@/components/checkin/InlineDailyCheckin';
import {
  Flame,
  Star,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  Calendar,
  Heart,
  Phone,
  HeartHandshake,
  Wind,
  SmilePlus,
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

/* ── quick-access items ───────────────────────────────── */
interface QuickItem {
  icon: React.ElementType;
  labelKey: string;
  to?: string;
  color: string;
  bg: string;
}

const QUICK_ITEMS: QuickItem[] = [
  { icon: SmilePlus, labelKey: 'home.checkinCard', to: '/employee/checkin', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: ClipboardList, labelKey: 'home.surveyCard', to: '/employee/survey', color: 'text-chart-2', bg: 'bg-chart-2/10' },
  { icon: TrendingUp, labelKey: 'home.moodTrend', to: '/employee/mood', color: 'text-chart-1', bg: 'bg-chart-1/10' },
  { icon: Flame, labelKey: 'home.currentStreak', color: 'text-chart-4', bg: 'bg-chart-4/10' },
  { icon: Phone, labelKey: 'crisisSupport.nav.crisisSupport', to: '/crisis-support', color: 'text-destructive', bg: 'bg-destructive/10' },
  { icon: HeartHandshake, labelKey: 'crisisSupport.nav.firstAider', to: '/first-aider', color: 'text-chart-1', bg: 'bg-chart-1/10' },
];

/* ── service-category cards ───────────────────────────── */
interface ServiceCategory {
  labelKey: string;
  items: { icon: React.ElementType; color: string }[];
  to: string;
}

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    labelKey: 'home.wellnessTools',
    to: '/employee/checkin',
    items: [
      { icon: SmilePlus, color: 'text-primary' },
      { icon: TrendingUp, color: 'text-chart-1' },
      { icon: Wind, color: 'text-chart-2' },
      { icon: Calendar, color: 'text-chart-4' },
    ],
  },
  {
    labelKey: 'home.supportServices',
    to: '/crisis-support',
    items: [
      { icon: Phone, color: 'text-destructive' },
      { icon: HeartHandshake, color: 'text-chart-1' },
      { icon: ClipboardList, color: 'text-chart-2' },
      { icon: Heart, color: 'text-primary' },
    ],
  },
];

/* ══════════════════════════════════════════════════════════
   EmployeeHome – Balady-style grid layout
   ══════════════════════════════════════════════════════════ */

export default function EmployeeHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employee, isLoading: empLoading } = useCurrentEmployee();
  const { streak, totalPoints, isLoading: gamLoading } = useGamification(employee?.id ?? null);
  const { moodData, avgMood7d, burnoutZone, monthlyCheckins, todayEntry, isLoading: moodLoading } =
    useMoodHistory(employee?.id ?? null);
  const { pendingQuestions, isLoading: sqLoading } = useScheduledQuestions(employee?.id, undefined);

  const firstName = employee?.full_name?.split(' ')[0] ?? '';
  const burnoutPercent = Math.round((avgMood7d / 5) * 100);
  const burnoutColor = burnoutZone === 'thriving' ? 'text-chart-1' : burnoutZone === 'watch' ? 'text-chart-4' : 'text-destructive';
  const burnoutBg = burnoutZone === 'thriving' ? 'bg-chart-1' : burnoutZone === 'watch' ? 'bg-chart-4' : 'bg-destructive';

  const chartData = moodData.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM'),
  }));

  /* ── loading skeleton ─────────────────────────────────── */
  if (empLoading) {
    return (
      <div className="space-y-6 p-2">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-20 shrink-0 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <div className="relative space-y-6">

        {/* ═══ SECTION 1 — Hero Banner ═══ */}
        {employee && !todayEntry && employee.user_id ? (
          /* Check-in CTA hero */
          <Card className="glass-card border-0 overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {getGreeting(t)}{firstName ? `, ${firstName}` : ''} 👋
                  </h1>
                  <p className="text-muted-foreground text-sm">{t('home.heroCheckinCta')}</p>
                  {/* Gamification badges */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="glass-badge gap-1.5 px-2.5 py-1 text-xs">
                      <Flame className="h-3.5 w-3.5 text-chart-4" />
                      {gamLoading ? '…' : streak} {t('home.dayStreak')}
                    </Badge>
                    <Badge variant="secondary" className="glass-badge gap-1.5 px-2.5 py-1 text-xs">
                      <Star className="h-3.5 w-3.5 text-chart-1" />
                      {gamLoading ? '…' : totalPoints} {t('home.points')}
                    </Badge>
                  </div>
                </div>
                <div className="text-5xl shrink-0 mt-1">🌤️</div>
              </div>
            </CardContent>
          </Card>
        ) : todayEntry ? (
          /* Done hero */
          <Card className="glass-card border-0 overflow-hidden bg-gradient-to-br from-chart-1/15 via-chart-1/5 to-transparent">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-chart-1/10 text-3xl">
                  {MOOD_EMOJIS[todayEntry.level] || '✅'}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold tracking-tight">{t('home.heroDoneTitle')}</h1>
                  <p className="text-muted-foreground text-sm mt-0.5">{t('home.heroDoneSubtitle')}</p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="glass-badge gap-1.5 px-2.5 py-1 text-xs">
                      <Flame className="h-3.5 w-3.5 text-chart-4" />
                      {gamLoading ? '…' : streak} {t('home.dayStreak')}
                    </Badge>
                    <Badge variant="secondary" className="glass-badge gap-1.5 px-2.5 py-1 text-xs">
                      <Star className="h-3.5 w-3.5 text-chart-1" />
                      {gamLoading ? '…' : totalPoints} {t('home.points')}
                    </Badge>
                  </div>
                </div>
                <CheckCircle2 className="h-7 w-7 text-chart-1 shrink-0" />
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Greeting-only hero (no employee user_id) */
          <Card className="glass-card border-0 overflow-hidden bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-5 sm:p-6">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {getGreeting(t)}{firstName ? `, ${firstName}` : ''} 👋
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{t('home.subtitle')}</p>
            </CardContent>
          </Card>
        )}

        {/* ═══ Inline Daily Check-in (preserved) ═══ */}
        {employee && !todayEntry && employee.user_id && (
          <InlineDailyCheckin employeeId={employee.id} tenantId={employee.tenant_id} userId={employee.user_id} />
        )}

        {/* ═══ SECTION 2 — Quick Access Row ═══ */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-0.5">{t('home.quickAccess')}</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {QUICK_ITEMS.map((item) => {
              const Icon = item.icon;
              const inner = (
                <div className="flex flex-col items-center gap-2 w-[76px] shrink-0 group">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} transition-transform group-hover:scale-105`}>
                    <Icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <span className="text-[11px] leading-tight text-center text-foreground/80 font-medium line-clamp-2">
                    {t(item.labelKey)}
                  </span>
                </div>
              );
              return item.to ? (
                <Link key={item.labelKey} to={item.to}>{inner}</Link>
              ) : (
                <div key={item.labelKey}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* ═══ Quick Stats Row ═══ */}
        <div className="grid gap-3 grid-cols-3">
          <Card className="glass-stat border-0">
            <CardContent className="p-4 flex flex-col items-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Calendar className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="text-xl font-bold">{moodLoading ? '—' : monthlyCheckins}</div>
              <p className="text-muted-foreground text-[10px] text-center">{t('home.monthlyCheckins')}</p>
            </CardContent>
          </Card>
          <Card className="glass-stat border-0">
            <CardContent className="p-4 flex flex-col items-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-1/10">
                <TrendingUp className="h-4.5 w-4.5 text-chart-1" />
              </div>
              <div className="text-xl font-bold">{moodLoading ? '—' : avgMood7d}</div>
              <p className="text-muted-foreground text-[10px] text-center">{t('home.avgMood')}</p>
            </CardContent>
          </Card>
          <Card className="glass-stat border-0">
            <CardContent className="p-4 flex flex-col items-center gap-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10">
                <Flame className="h-4.5 w-4.5 text-chart-4" />
              </div>
              <div className="text-xl font-bold">{gamLoading ? '—' : streak}</div>
              <p className="text-muted-foreground text-[10px] text-center">{t('home.currentStreak')}</p>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Pending Surveys (if any) ═══ */}
        {(sqLoading || pendingQuestions.length > 0) && (
          <Card
            className="glass-card border-0 ring-1 ring-chart-2/20 cursor-pointer transition-all hover:shadow-lg hover:ring-chart-2/40"
            onClick={() => navigate('/employee/survey')}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-chart-2/10">
                <ClipboardList className="h-6 w-6 text-chart-2" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{t('home.surveyCard')}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {sqLoading ? '…' : t('home.pendingSurveys', { count: pendingQuestions.length })}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
            </CardContent>
          </Card>
        )}

        {/* ═══ SECTION 3 — Service Categories (2-col grid) ═══ */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-0.5">{t('home.myServices')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link key={cat.labelKey} to={cat.to}>
                <Card className="glass-card border-0 cursor-pointer transition-all hover:shadow-lg h-full">
                  <CardContent className="p-4 space-y-3">
                    {/* 2×2 icon grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {cat.items.map((si, idx) => {
                        const SIcon = si.icon;
                        return (
                          <div
                            key={idx}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50"
                          >
                            <SIcon className={`h-5 w-5 ${si.color}`} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{t(cat.labelKey)}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {cat.items.length}+ {t('home.services')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* ═══ SECTION 4 — Mood History Chart ═══ */}
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
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
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

        {/* ═══ SECTION 5 — Burnout Indicator ═══ */}
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
                  <span className={`font-medium ${burnoutColor}`}>{t(`home.${burnoutZone}`)}</span>
                  <span className="text-muted-foreground">{avgMood7d}/5</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/30">
                  <div className={`h-full rounded-full transition-all duration-700 ${burnoutBg}`} style={{ width: `${burnoutPercent}%` }} />
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
