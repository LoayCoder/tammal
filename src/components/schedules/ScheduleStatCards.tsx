import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Pause } from 'lucide-react';
import type { QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';

interface ScheduleStatCardsProps {
  schedules: QuestionSchedule[];
}

export function ScheduleStatCards({ schedules }: ScheduleStatCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedules.activeSchedules')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{schedules.filter(s => s.status === 'active').length}</div>
        </CardContent>
      </Card>
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedules.totalSchedules')}</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{schedules.length}</div>
        </CardContent>
      </Card>
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('schedules.pausedSchedules')}</CardTitle>
          <Pause className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{schedules.filter(s => s.status === 'paused').length}</div>
        </CardContent>
      </Card>
    </div>
  );
}
