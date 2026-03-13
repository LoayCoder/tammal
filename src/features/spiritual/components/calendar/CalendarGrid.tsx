import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Star, UtensilsCrossed } from 'lucide-react';
import { ISLAMIC_EVENTS, isWhiteDay, isSunnahFastingDay } from '@/features/spiritual/hooks/spiritual/useHijriCalendar';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

type CalendarView = 'month' | 'week';

interface CalendarDayData {
  gregorian: string;
  hijri: {
    day: string;
    month: { number: number; en: string; ar: string };
    year: string;
    holidays?: string[];
  };
}

interface CalendarGridProps {
  displayGrid: (CalendarDayData | null)[];
  calendarView: CalendarView;
  isLoading: boolean;
  error: Error | null;
  isRTL: boolean;
  todayStr: string;
}

export function CalendarGrid({ displayGrid, calendarView, isLoading, error, isRTL, todayStr }: CalendarGridProps) {
  const { t } = useTranslation();
  const weekdays = isRTL ? WEEKDAYS_AR : WEEKDAYS_EN;

  if (isLoading) return <Skeleton className="h-64" />;

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p className="text-sm font-medium">{t('spiritual.calendar.fetchError', 'Failed to load calendar data. Please try again.')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekdays.map(d => (
        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
      ))}
      {displayGrid.map((day, idx) => {
        if (!day) return <div key={`empty-${idx}`} className={calendarView === 'week' ? 'min-h-[5rem]' : ''} />;
        const isToday = day.gregorian === todayStr;
        const hijriDay = parseInt(day.hijri.day);
        const hijriKey = `${day.hijri.month.number}-${hijriDay}`;
        const event = ISLAMIC_EVENTS[hijriKey];
        const white = isWhiteDay(hijriDay);
        const sunnah = isSunnahFastingDay(new Date(day.gregorian));
        const hasHoliday = !event && day.hijri.holidays?.length;
        const cellHeight = calendarView === 'week' ? 'min-h-[5rem]' : 'min-h-[3.5rem]';

        return (
          <div
            key={day.gregorian}
            className={`relative p-1.5 rounded-md text-center ${cellHeight} border transition-colors ${
              isToday ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-transparent'
            } ${event || hasHoliday ? 'bg-accent/40' : ''} ${white || sunnah ? 'bg-chart-2/10' : ''}`}
          >
            <div className="text-sm font-medium">{new Date(day.gregorian).getDate()}</div>
            <div className="text-2xs text-muted-foreground">{day.hijri.day}</div>
            <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
              {(event || hasHoliday) && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
              {(white || sunnah || event?.isFastingDay || day.hijri.month.number === 9) && (
                <UtensilsCrossed className="h-3 w-3 text-chart-2" />
              )}
            </div>
            {calendarView === 'week' && (event || hasHoliday) && (
              <p className="text-2xs text-chart-4 font-medium mt-0.5 leading-tight truncate">
                {event ? (isRTL ? event.ar : event.en) : day.hijri.holidays?.[0]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

