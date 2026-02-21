import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { TimeRange } from '@/hooks/useOrgAnalytics';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const { t } = useTranslation();

  return (
    <ToggleGroup
      type="single"
      value={String(value)}
      onValueChange={(v) => v && onChange(Number(v) as TimeRange)}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="7">{t('orgDashboard.timeRange.7d')}</ToggleGroupItem>
      <ToggleGroupItem value="30">{t('orgDashboard.timeRange.30d')}</ToggleGroupItem>
      <ToggleGroupItem value="90">{t('orgDashboard.timeRange.90d')}</ToggleGroupItem>
    </ToggleGroup>
  );
}
