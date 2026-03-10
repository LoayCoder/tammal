import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarIcon, Star, UtensilsCrossed } from 'lucide-react';
import { useHijriCalendar, useHijriToday, ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/hooks/spiritual/useHijriCalendar';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useNavigate } from 'react-router-dom';
import { CalendarNavigation } from '@/components/spiritual/calendar/CalendarNavigation';
import { CalendarGrid } from '@/components/spiritual/calendar/CalendarGrid';
import { CalendarEventList } from '@/components/spiritual/calendar/CalendarEventList';

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

  const calendarGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    const firstDayOfWeek = new Date(calendarDays[0].gregorian).getDay();
    const grid: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) grid.push(null);
    calendarDays.forEach(d => grid.push(d));
    return grid;
  }, [calendarDays]);

  const weekGrid = useMemo(() => {
    if (!calendarDays?.length) return [];
    const todayIndex = calendarDays.findIndex(d => d.gregorian === todayStr);
    const centerIndex = todayIndex >= 0 ? todayIndex : 0;
    const centerDate = new Date(calendarDays[centerIndex].gregorian);
    const dayOfWeek = centerDate.getDay();
    const weekStartIndex = centerIndex - dayOfWeek;
    const week: (typeof calendarDays[0] | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const idx = weekStartIndex + i;
      if (idx >= 0 && idx < calendarDays.length) week.push(calendarDays[idx]);
      else week.push(null);
    }
    return week;
  }, [calendarDays, todayStr]);

  const displayGrid = calendarView === 'week' ? weekGrid : calendarGrid;

  const enrichedDays = useMemo(() => {
    if (!calendarDays?.length) return [];
    return calendarDays.map(day => {
      const hijriDay = parseInt(day.hijri.day);
      const hijriMonth = day.hijri.month.number;
      const hijriKey = `${hijriMonth}-${hijriDay}`;
      const event = ISLAMIC_EVENTS[hijriKey];
      const white = isWhiteDay(hijriDay);
      const gregDate = new Date(day.gregorian);
      const sunnah = isSunnahFastingDay(gregDate);
      const isRamadan = hijriMonth === 9;
      return { ...day, event, isWhiteDay: white, isSunnahDay: sunnah, isRamadan };
    });
  }, [calendarDays]);

  const islamicEvents = useMemo(() => {
    return enrichedDays.filter(d => d.event || (d.hijri.holidays?.length > 0 && !d.event));
  }, [enrichedDays]);

  const fastingData = useMemo(() => {
    const specialFasting: typeof enrichedDays = [];
    let sunnahMondays = 0, sunnahThursdays = 0, whiteDayCount = 0, ramadanCount = 0;
    enrichedDays.forEach(d => {
      if (d.isRamadan) { ramadanCount++; return; }
      if (d.event?.isFastingDay) { specialFasting.push(d); return; }
      if (d.isWhiteDay) { whiteDayCount++; return; }
      if (d.isSunnahDay) {
        const dow = new Date(d.gregorian).getDay();
        if (dow === 1) sunnahMondays++;
        if (dow === 4) sunnahThursdays++;
      }
    });
    return { specialFasting, sunnahMondays, sunnahThursdays, whiteDayCount, ramadanCount };
  }, [enrichedDays]);

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <CalendarNavigation
        viewMonth={viewMonth} viewYear={viewYear} calendarView={calendarView}
        onPrevMonth={prevMonth} onNextMonth={nextMonth} onViewChange={setCalendarView}
        hijriToday={hijriToday ?? null} isRTL={isRTL}
      />

      {/* Calendar grid is rendered inside the navigation card */}
      <Card className="glass-card border-0 rounded-xl -mt-4">
        <CardContent className="pt-4">
          <CalendarGrid
            displayGrid={displayGrid} calendarView={calendarView}
            isLoading={calLoading} error={calError as Error | null}
            isRTL={isRTL} todayStr={todayStr}
          />
        </CardContent>
      </Card>

      <CalendarEventList
        islamicEvents={islamicEvents} fastingData={fastingData}
        todayStr={todayStr} isRTL={isRTL}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-chart-4 fill-chart-4" /> {t('spiritual.calendar.legendEvent', 'Islamic Event')}</span>
        <span className="flex items-center gap-1"><UtensilsCrossed className="h-3 w-3 text-chart-2" /> {t('spiritual.calendar.legendFasting', 'Recommended Fasting')}</span>
      </div>
    </div>
  );
}
