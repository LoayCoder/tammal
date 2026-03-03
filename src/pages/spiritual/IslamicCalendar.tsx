import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, UtensilsCrossed, CalendarDays, CalendarRange } from 'lucide-react';
import { useHijriCalendar, useHijriToday, ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/hooks/spiritual/useHijriCalendar';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type CalendarView = 'month' | 'week';

export default function IslamicCalendar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { isEnabled, isPending: prefsLoading } = useSpiritualPreferences();

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');

  const { data: calendarDays, isLoading: calLoading, error: calError } = useHijriCalendar(viewMonth, viewYear);
  const { data: hijriToday } = useHijriToday();

  const todayStr = now.toISOString().split('T')[0];

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  // Build full month calendar grid
  const calendarGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    const firstDayOfWeek = new Date(calendarDays[0].gregorian).getDay();
    const grid: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    calendarDays.forEach(d => grid.push(d));
    return grid;
  }, [calendarDays]);

  // Week view: get the current week's days from the calendar data
  const weekGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    // Find today's index, or use the first day of the month
    const todayIndex = calendarDays.findIndex(d => d.gregorian === todayStr);
    const centerIndex = todayIndex >= 0 ? todayIndex : 0;
    // Find the start of the week (Sunday)
    const centerDate = new Date(calendarDays[centerIndex].gregorian);
    const dayOfWeek = centerDate.getDay();
    const weekStartIndex = centerIndex - dayOfWeek;

    const week: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const idx = weekStartIndex + i;
      if (idx >= 0 && idx < calendarDays.length) {
        week.push(calendarDays[idx]);
      } else {
        week.push(null);
      }
    }
    return week;
  }, [calendarDays, todayStr]);

  const displayGrid = calendarView === 'week' ? weekGrid : calendarGrid;

  // Enrich all days with event/fasting info
  const enrichedDays = useMemo(() => {
    if (!calendarDays?.length) return [];
    return calendarDays.map(day => {
      const hijriDay = parseInt(day.hijri.day);
      const hijriKey = `${day.hijri.month.number}-${hijriDay}`;
      const event = ISLAMIC_EVENTS[hijriKey];
      const white = isWhiteDay(hijriDay);
      const gregDate = new Date(day.gregorian);
      const sunnah = isSunnahFastingDay(gregDate);
      return { ...day, event, isWhiteDay: white, isSunnahDay: sunnah };
    });
  }, [calendarDays]);

  // Events list: Islamic events + White Days + Sunnah fasting days
  const monthEvents = useMemo(() => {
    return enrichedDays.filter(d =>
      d.event || d.isWhiteDay || d.isSunnahDay || (d.hijri.holidays?.length > 0)
    );
  }, [enrichedDays]);

  // Separate categories for display
  const islamicEvents = useMemo(() =>
    enrichedDays.filter(d => d.event || (d.hijri.holidays?.length > 0)),
    [enrichedDays]
  );
  const fastingDays = useMemo(() =>
    enrichedDays.filter(d => d.isWhiteDay || d.isSunnahDay || d.event?.isFastingDay),
    [enrichedDays]
  );

  if (prefsLoading) return <div className="container mx-auto py-6"><div><Skeleton className="h-64" /></div></div>;

  if (!isEnabled) {
    return (
      <div className="container mx-auto py-6">
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="p-12 text-center space-y-4">
            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.calendar.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.calendar.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const weekdays = isRTL ? WEEKDAYS_AR : WEEKDAYS_EN;

  const getDayLabel = (day: typeof enrichedDays[0]) => {
    const isRtl = isRTL;
    if (day.event) return isRtl ? day.event.ar : day.event.en;
    if (day.hijri.holidays?.length > 0) return day.hijri.holidays[0];
    if (day.isWhiteDay) return isRtl ? 'أيام البيض' : 'White Day (Fasting)';
    if (day.isSunnahDay) {
      const dow = new Date(day.gregorian).getDay();
      if (dow === 1) return isRtl ? 'صيام الإثنين (سنة)' : 'Monday Sunnah Fast';
      if (dow === 4) return isRtl ? 'صيام الخميس (سنة)' : 'Thursday Sunnah Fast';
    }
    return '';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Hijri today */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('spiritual.calendar.title')}</h1>
            {hijriToday && (
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? `${hijriToday.day} ${hijriToday.month.ar} ${hijriToday.year} هـ`
                  : `${hijriToday.day} ${hijriToday.month.en} ${hijriToday.year} AH`}
              </p>
            )}
          </div>
        </div>

        {/* View toggle */}
        <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as CalendarView)}>
          <TabsList>
            <TabsTrigger value="week" className="gap-1.5">
              <CalendarRange className="h-4 w-4" />
              {t('spiritual.calendar.weekView', 'Week')}
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {t('spiritual.calendar.monthView', 'Month')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Month navigation */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
            <CardTitle className="text-lg">
              {MONTHS_EN[viewMonth]} {viewYear}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {calLoading ? (
            <div><Skeleton className="h-64" /></div>
          ) : calError ? (
            <div className="text-center py-8 text-destructive">
              <p className="text-sm font-medium">{t('spiritual.calendar.fetchError', 'Failed to load calendar data. Please try again.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {weekdays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {/* Calendar cells */}
              {displayGrid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className={calendarView === 'week' ? 'min-h-[5rem]' : ''} />;
                const isToday = day.gregorian === todayStr;
                const hijriDay = parseInt(day.hijri.day);
                const hijriKey = `${day.hijri.month.number}-${hijriDay}`;
                const event = ISLAMIC_EVENTS[hijriKey];
                const white = isWhiteDay(hijriDay);
                const sunnah = isSunnahFastingDay(new Date(day.gregorian));
                const hasHoliday = day.hijri.holidays?.length > 0;

                const cellHeight = calendarView === 'week' ? 'min-h-[5rem]' : 'min-h-[3.5rem]';

                return (
                  <div
                    key={day.gregorian}
                    className={`relative p-1.5 rounded-md text-center ${cellHeight} border transition-colors ${
                      isToday ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-transparent'
                    } ${event || hasHoliday ? 'bg-accent/40' : ''} ${white || sunnah ? 'bg-chart-2/10' : ''}`}
                  >
                    <div className="text-sm font-medium">{new Date(day.gregorian).getDate()}</div>
                    <div className="text-[10px] text-muted-foreground">{day.hijri.day}</div>
                    <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
                      {(event || hasHoliday) && (
                        <Star className="h-3 w-3 text-chart-4 fill-chart-4" />
                      )}
                      {(white || sunnah || event?.isFastingDay) && (
                        <UtensilsCrossed className="h-3 w-3 text-chart-2" />
                      )}
                    </div>
                    {calendarView === 'week' && (event || hasHoliday) && (
                      <p className="text-[9px] text-chart-4 font-medium mt-0.5 leading-tight truncate">
                        {event ? (isRTL ? event.ar : event.en) : day.hijri.holidays?.[0]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Islamic Events this month */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-chart-4" />
            {t('spiritual.calendar.upcomingEvents', 'Islamic Events This Month')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {islamicEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('spiritual.calendar.noEvents', 'No Islamic events this month')}</p>
          ) : (
            islamicEvents.map(day => {
              const label = getDayLabel(day);
              return (
                <div key={`event-${day.gregorian}`} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[3rem] bg-accent/30 rounded-lg p-1.5">
                      <div className="text-sm font-bold">{new Date(day.gregorian).getDate()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {isRTL ? day.hijri.month.ar : day.hijri.month.en} {day.hijri.day}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                    </div>
                  </div>
                  {day.event?.isFastingDay && (
                    <Badge variant="secondary" className="text-xs">
                      <UtensilsCrossed className="h-3 w-3 me-1" />
                      {t('spiritual.calendar.fastingDay', 'Fasting Day')}
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recommended Fasting Days */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-chart-2" />
            {t('spiritual.calendar.recommendedFasting', 'Recommended Fasting Days')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fastingDays.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('spiritual.calendar.noFastingDays', 'No recommended fasting days this month')}
            </p>
          ) : (
            fastingDays.map(day => {
              const gregDate = new Date(day.gregorian);
              const dayOfWeek = gregDate.getDay();
              const dayName = isRTL ? WEEKDAYS_AR[dayOfWeek] : WEEKDAYS_EN[dayOfWeek];

              let reason = '';
              if (day.event?.isFastingDay) {
                reason = isRTL ? day.event.ar : day.event.en;
              } else if (day.isWhiteDay) {
                reason = isRTL ? 'أيام البيض (13-14-15)' : 'White Days (13th-15th)';
              } else if (day.isSunnahDay) {
                reason = isRTL ? 'صيام السنة' : 'Sunnah Fasting';
              }

              const isPast = day.gregorian < todayStr;

              return (
                <div
                  key={`fast-${day.gregorian}`}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 ${
                    isPast ? 'opacity-50' : ''
                  } ${day.gregorian === todayStr ? 'bg-chart-2/10 border-chart-2/30' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[2.5rem]">
                      <div className="text-sm font-bold">{gregDate.getDate()}</div>
                      <div className="text-[10px] text-muted-foreground">{dayName}</div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{reason}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {isRTL ? day.hijri.month.ar : day.hijri.month.en} {day.hijri.day}
                      </p>
                    </div>
                  </div>
                  {day.gregorian === todayStr && (
                    <Badge variant="default" className="text-xs">
                      {t('spiritual.calendar.today', 'Today')}
                    </Badge>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-chart-4 fill-chart-4" /> {t('spiritual.calendar.legendEvent', 'Islamic Event')}</span>
        <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3 text-chart-2" /> {t('spiritual.calendar.legendFasting', 'Recommended Fasting')}</span>
      </div>
    </div>
  );
}
