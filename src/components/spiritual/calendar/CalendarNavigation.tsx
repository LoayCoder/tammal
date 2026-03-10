import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays, CalendarRange } from 'lucide-react';

const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type CalendarView = 'month' | 'week';

interface CalendarNavigationProps {
  viewMonth: number;
  viewYear: number;
  calendarView: CalendarView;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onViewChange: (view: CalendarView) => void;
  hijriToday: { day: string; month: { en: string; ar: string }; year: string } | null;
  isRTL: boolean;
}

export function CalendarNavigation({
  viewMonth, viewYear, calendarView, onPrevMonth, onNextMonth, onViewChange,
  hijriToday, isRTL,
}: CalendarNavigationProps) {
  const { t } = useTranslation();

  return (
    <>
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
        <Tabs value={calendarView} onValueChange={(v) => onViewChange(v as CalendarView)}>
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

      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={onPrevMonth}>
              <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
            <CardTitle className="text-lg">{MONTHS_EN[viewMonth]} {viewYear}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onNextMonth}>
              <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}
