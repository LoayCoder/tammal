import React from 'react';
import { useTranslation } from 'react-i18next';
import { TimeRangeSelector } from '@/components/dashboard/TimeRangeSelector';
import type { TimeRange } from '@/lib/analytics/types';

interface Props {
  timeRange: TimeRange;
  onTimeRangeChange: (v: TimeRange) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (s: string, e: string) => void;
}

export const DashboardHeader = React.memo(function DashboardHeader({
  timeRange, onTimeRangeChange, customStart, customEnd, onCustomChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('orgDashboard.title')}</h1>
        <p className="text-muted-foreground">{t('orgDashboard.subtitle')}</p>
      </div>
      <TimeRangeSelector
        value={timeRange}
        onChange={onTimeRangeChange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomChange={onCustomChange}
      />
    </div>
  );
});
