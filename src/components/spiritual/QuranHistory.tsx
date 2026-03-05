import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ChevronDown, Flame, CalendarIcon, History, Clock, BookOpen, Calendar as CalendarIconSolid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuranHistory, type QuranHistoryRange } from '@/hooks/spiritual/useQuranHistory';

const RANGE_OPTIONS: QuranHistoryRange[] = ['week', 'month', 'quarter', 'year', 'custom'];

export const QuranHistory = React.memo(function QuranHistory() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const {
    range, setRange,
    customFrom, customTo, setCustomFrom, setCustomTo,
    dailyData, topSurahs,
    currentStreak, bestStreak,
    totalMinutes, totalSessions, avgMinutesPerSession, activeDays,
    isPending,
  } = useQuranHistory();

  const isRTL = i18n.dir() === 'rtl';

  const chartData = dailyData.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="glass-card border-0 rounded-xl">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/40 transition-colors rounded-t-xl">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('spiritual.quran.history.title')}
              </span>
              <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-5">
            {/* Range selector */}
            <div className="flex flex-wrap items-center gap-3">
              <ToggleGroup
                type="single"
                value={range}
                onValueChange={(v) => v && setRange(v as QuranHistoryRange)}
                className="flex-wrap"
              >
                {RANGE_OPTIONS.map((r) => (
                  <ToggleGroupItem key={r} value={r} size="sm" className="text-xs">
                    {t(`spiritual.prayer.history.${r}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {range === 'custom' && (
                <div className="flex items-center gap-2">
                  <DatePicker
                    value={customFrom ? new Date(customFrom + 'T00:00:00') : undefined}
                    onChange={(d) => setCustomFrom(d?.toISOString().split('T')[0])}
                    label={t('common.from')}
                  />
                  <DatePicker
                    value={customTo ? new Date(customTo + 'T00:00:00') : undefined}
                    onChange={(d) => setCustomTo(d?.toISOString().split('T')[0])}
                    label={t('common.to')}
                  />
                </div>
              )}
            </div>

            {isPending ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                {t('common.loading')}
              </div>
            ) : dailyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                {t('spiritual.quran.history.noData')}
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    icon={<Clock className="h-4 w-4 text-primary" />}
                    value={totalMinutes}
                    label={t('spiritual.quran.history.totalMinutes')}
                  />
                  <StatCard
                    icon={<BookOpen className="h-4 w-4 text-primary" />}
                    value={totalSessions}
                    label={t('spiritual.quran.history.totalSessions')}
                  />
                  <StatCard
                    icon={<CalendarIconSolid className="h-4 w-4 text-primary" />}
                    value={activeDays}
                    label={t('spiritual.quran.history.activeDays')}
                  />
                  <StatCard
                    icon={<Clock className="h-4 w-4 text-primary" />}
                    value={`${avgMinutesPerSession} ${t('spiritual.quran.history.minutes')}`}
                    label={t('spiritual.quran.history.avgPerSession')}
                  />
                </div>

                {/* Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                        reversed={isRTL}
                        interval={range === 'week' ? 0 : 'preserveStartEnd'}
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                        orientation={isRTL ? 'right' : 'left'}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'totalMinutes'
                            ? `${value} ${t('spiritual.quran.history.minutes')}`
                            : value,
                          name === 'totalMinutes'
                            ? t('spiritual.quran.history.dailyMinutes')
                            : t('spiritual.quran.history.sessions'),
                        ]}
                        contentStyle={{ borderRadius: 8, border: 'none' }}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'totalMinutes'
                            ? t('spiritual.quran.history.dailyMinutes')
                            : t('spiritual.quran.history.sessions')
                        }
                      />
                      <Bar dataKey="totalMinutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sessionCount" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Streaks */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">{currentStreak} {t('spiritual.quran.history.days')}</p>
                      <p className="text-xs text-muted-foreground">{t('spiritual.quran.history.streak')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{bestStreak} {t('spiritual.quran.history.days')}</p>
                      <p className="text-xs text-muted-foreground">{t('spiritual.quran.history.bestStreak')}</p>
                    </div>
                  </div>
                </div>

                {/* Top Surahs */}
                {topSurahs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">📖 {t('spiritual.quran.history.topSurahs')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {topSurahs.map((s) => (
                        <Badge key={s.name} variant="secondary" className="gap-1.5 py-1">
                          {s.name}
                          <span className="text-muted-foreground">×{s.count}</span>
                          <span className="text-muted-foreground text-[10px]">({s.totalMinutes} {t('spiritual.quran.history.minutes')})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});

/* ---------- StatCard ---------- */
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <Card className="border rounded-lg">
      <CardContent className="p-3 flex items-center gap-2">
        <div className="rounded-full bg-primary/10 p-1.5">{icon}</div>
        <div>
          <p className="text-lg font-bold leading-tight">{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Mini DatePicker ---------- */
function DatePicker({ value, onChange, label }: { value?: Date; onChange: (d?: Date) => void; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <CalendarIcon className="h-3 w-3" />
          {value
            ? value.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
            : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => onChange(d ?? undefined)}
          disabled={(d) => d > new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
