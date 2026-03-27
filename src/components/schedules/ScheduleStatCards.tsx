import { useTranslation } from 'react-i18next';
import { Calendar, Pause } from 'lucide-react';
import type { QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';
import { MetricCard } from '@/components/system';

interface ScheduleStatCardsProps {
  schedules: QuestionSchedule[];
}

export function ScheduleStatCards({ schedules }: ScheduleStatCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title={t('schedules.activeSchedules')}
        value={schedules.filter(s => s.status === 'active').length}
        icon={<Calendar className="h-4 w-4" />}
      />
      <MetricCard
        title={t('schedules.totalSchedules')}
        value={schedules.length}
        icon={<Calendar className="h-4 w-4" />}
      />
      <MetricCard
        title={t('schedules.pausedSchedules')}
        value={schedules.filter(s => s.status === 'paused').length}
        icon={<Pause className="h-4 w-4" />}
      />
    </div>
  );
}
