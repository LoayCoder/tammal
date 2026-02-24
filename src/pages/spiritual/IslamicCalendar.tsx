import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Star, UtensilsCrossed } from 'lucide-react';
import { useHijriCalendar, useHijriToday, ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/hooks/useHijriCalendar';
import { useSpiritualPreferences } from '@/hooks/useSpiritualPreferences';
import { useNavigate } from 'react-router-dom';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function IslamicCalendar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { isEnabled, isLoading: prefsLoading } = useSpiritualPreferences();

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const { data: calendarDays, isLoading: calLoading } = useHijriCalendar(viewMonth, viewYear);
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

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    const firstDayOfWeek = new Date(calendarDays[0].gregorian).getDay();
    const grid: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    calendarDays.forEach(d => grid.push(d));
    return grid;
  }, [calendarDays]);

  // Events this month
  const monthEvents = useMemo(() => {
    if (!calendarDays?.length) return [];
    return calendarDays
      .map(day => {
        const hijriKey = `${day.hijri.month.number}-${parseInt(day.hijri.day)}`;
        const event = ISLAMIC_EVENTS[hijriKey];
        const white = isWhiteDay(parseInt(day.hijri.day));
        const sunnah = isSunnahFastingDay(new Date(day.gregorian));
        return { ...day, event, isWhiteDay: white, isSunnahDay: sunnah };
      })
      .filter(d => d.event || d.isWhiteDay || (d.hijri.holidays?.length > 0));
  }, [calendarDays]);

  if (prefsLoading) return <div className="container mx-auto py-6"><Skeleton className="h-64" /></div>;

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
            <Skeleton className="h-64" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Weekday headers */}
              {weekdays.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {/* Calendar cells */}
              {calendarGrid.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />;
                const isToday = day.gregorian === todayStr;
                const hijriDay = parseInt(day.hijri.day);
                const hijriKey = `${day.hijri.month.number}-${hijriDay}`;
                const event = ISLAMIC_EVENTS[hijriKey];
                const white = isWhiteDay(hijriDay);
                const sunnah = isSunnahFastingDay(new Date(day.gregorian));
                const hasHoliday = day.hijri.holidays?.length > 0;

                return (
                  <div
                    key={day.gregorian}
                    className={`relative p-1 rounded-md text-center min-h-[3.5rem] border ${
                      isToday ? 'border-primary bg-primary/10' : 'border-transparent'
                    } ${event || hasHoliday ? 'bg-accent/30' : ''}`}
                  >
                    <div className="text-sm font-medium">{new Date(day.gregorian).getDate()}</div>
                    <div className="text-[10px] text-muted-foreground">{day.hijri.day}</div>
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {(event || hasHoliday) && <Star className="h-2.5 w-2.5 text-chart-4" />}
                      {(white || sunnah || event?.isFastingDay) && <UtensilsCrossed className="h-2.5 w-2.5 text-chart-2" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events list */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">{t('spiritual.calendar.upcomingEvents')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monthEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t('spiritual.calendar.noEvents')}</p>
          ) : (
            monthEvents.slice(0, 10).map(day => {
              const hijriKey = `${day.hijri.month.number}-${parseInt(day.hijri.day)}`;
              const event = ISLAMIC_EVENTS[hijriKey];
              const displayName = event
                ? (isRTL ? event.ar : event.en)
                : day.isWhiteDay
                  ? (isRTL ? 'أيام البيض' : 'White Day')
                  : day.hijri.holidays?.[0] || '';

              return (
                <div key={day.gregorian} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[3rem]">
                      <div className="text-sm font-bold">{new Date(day.gregorian).getDate()}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {isRTL ? day.hijri.month.ar : day.hijri.month.en} {day.hijri.day}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{displayName}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {event?.isFastingDay && (
                      <Badge variant="secondary" className="text-xs">
                        <UtensilsCrossed className="h-3 w-3 me-1" />
                        {t('spiritual.calendar.fastingDay')}
                      </Badge>
                    )}
                    {day.isWhiteDay && !event?.isFastingDay && (
                      <Badge variant="outline" className="text-xs">
                        <UtensilsCrossed className="h-3 w-3 me-1" />
                        {t('spiritual.calendar.whiteDay')}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-chart-4" /> {t('spiritual.calendar.legendEvent')}</span>
        <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3 text-chart-2" /> {t('spiritual.calendar.legendFasting')}</span>
      </div>
    </div>
  );
}
