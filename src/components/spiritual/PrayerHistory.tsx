import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ChevronDown, Flame, CalendarIcon, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePrayerHistory, type HistoryRange } from '@/hooks/spiritual/usePrayerHistory';

const RANGE_OPTIONS: HistoryRange[] = ['week', 'month', 'quarter', 'year', 'custom'];

const PRAYER_COLORS: Record<string, string> = {
  Fajr: 'hsl(var(--primary))',
  Dhuhr: 'hsl(var(--chart-1))',
  Asr: 'hsl(var(--chart-2))',
  Maghrib: 'hsl(var(--chart-3))',
  Isha: 'hsl(var(--chart-4))',
  Witr: 'hsl(var(--chart-5))',
};

export const PrayerHistory = React.memo(function PrayerHistory() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const {
    range, setRange,
    customFrom, customTo, setCustomFrom, setCustomTo,
    dailyData, prayerStats, rawatibStats,
    currentStreak, bestStreak,
    isPending,
  } = usePrayerHistory();

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
                {t('spiritual.prayer.history.title')}
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
                onValueChange={(v) => v && setRange(v as HistoryRange)}
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
                {t('spiritual.prayer.history.noData')}
              </div>
            ) : (
              <>
                {/* Chart with Rawatib overlay */}
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
                        domain={[0, 100]}
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                        orientation={isRTL ? 'right' : 'left'}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value}%`,
                          name === 'pct'
                            ? t('spiritual.prayer.history.completionRate')
                            : t('spiritual.prayer.history.rawatibRate'),
                        ]}
                        contentStyle={{ borderRadius: 8, border: 'none' }}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'pct'
                            ? t('spiritual.prayer.history.completionRate')
                            : t('spiritual.prayer.history.rawatibRate')
                        }
                      />
                      <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="rawatibPct" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Streaks */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-sm font-medium">{currentStreak} {t('spiritual.prayer.history.days')}</p>
                      <p className="text-xs text-muted-foreground">{t('spiritual.prayer.history.streak')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{bestStreak} {t('spiritual.prayer.history.days')}</p>
                      <p className="text-xs text-muted-foreground">{t('spiritual.prayer.history.bestStreak')}</p>
                    </div>
                  </div>
                </div>

                {/* Per-prayer breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-3">{t('spiritual.prayer.history.perPrayer')}</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {prayerStats.map((s) => (
                      <Card key={s.prayerName} className="border rounded-lg">
                        <CardContent className="p-3 text-center space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t(`spiritual.prayer.names.${s.prayerName.toLowerCase()}`, s.prayerName)}
                          </p>
                          <p className="text-xl font-bold" style={{ color: PRAYER_COLORS[s.prayerName] }}>
                            {s.pct}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.completed}/{s.total}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Rawatib Breakdown */}
                {rawatibStats.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">📿 {t('spiritual.prayer.history.rawatib')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {rawatibStats.map((s) => (
                        <Card key={s.prayerName} className="border rounded-lg">
                          <CardContent className="p-3 space-y-2">
                            <p className="text-sm font-medium text-center" style={{ color: PRAYER_COLORS[s.prayerName] }}>
                              {t(`spiritual.prayer.names.${s.prayerName.toLowerCase()}`, s.prayerName)}
                            </p>
                            {s.beforeTotal > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{t('spiritual.prayer.history.rakaahsBefore')}</span>
                                  <span className="font-medium">{s.beforePct}%</span>
                                </div>
                                <Progress value={s.beforePct} className="h-1.5" />
                                <p className="text-[10px] text-muted-foreground text-end">
                                  {s.beforeCompleted}/{s.beforeTotal}
                                </p>
                              </div>
                            )}
                            {s.afterTotal > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{t('spiritual.prayer.history.rakaahsAfter')}</span>
                                  <span className="font-medium">{s.afterPct}%</span>
                                </div>
                                <Progress value={s.afterPct} className="h-1.5" />
                                <p className="text-[10px] text-muted-foreground text-end">
                                  {s.afterCompleted}/{s.afterTotal}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
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
