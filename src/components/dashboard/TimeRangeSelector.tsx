import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { TimeRange } from '@/hooks/useOrgAnalytics';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  customStart?: string;
  customEnd?: string;
  onCustomChange?: (start: string, end: string) => void;
}

export function TimeRangeSelector({ value, onChange, customStart, customEnd, onCustomChange }: TimeRangeSelectorProps) {
  const { t } = useTranslation();

  const handleToggle = (v: string) => {
    if (!v) return;
    if (v === 'custom') {
      onChange('custom');
    } else {
      onChange(Number(v) as TimeRange);
    }
  };

  const startDate = customStart ? parseISO(customStart) : undefined;
  const endDate = customEnd ? parseISO(customEnd) : undefined;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <ToggleGroup
        type="single"
        value={value === 'custom' ? 'custom' : String(value)}
        onValueChange={handleToggle}
        variant="outline"
        size="sm"
      >
        <ToggleGroupItem value="7">{t('orgDashboard.timeRange.7d')}</ToggleGroupItem>
        <ToggleGroupItem value="30">{t('orgDashboard.timeRange.30d')}</ToggleGroupItem>
        <ToggleGroupItem value="90">{t('orgDashboard.timeRange.90d')}</ToggleGroupItem>
        <ToggleGroupItem value="custom">{t('orgDashboard.customRange')}</ToggleGroupItem>
      </ToggleGroup>

      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                {startDate ? format(startDate, 'dd/MM/yyyy') : t('orgDashboard.startDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(d) => {
                  if (d && onCustomChange) {
                    const s = format(d, 'yyyy-MM-dd');
                    onCustomChange(s, customEnd || format(new Date(), 'yyyy-MM-dd'));
                  }
                }}
                disabled={(date) => date > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-xs">—</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <CalendarIcon className="h-3.5 w-3.5" />
                {endDate ? format(endDate, 'dd/MM/yyyy') : t('orgDashboard.endDate')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(d) => {
                  if (d && onCustomChange) {
                    const e = format(d, 'yyyy-MM-dd');
                    onCustomChange(customStart || format(new Date(), 'yyyy-MM-dd'), e);
                  }
                }}
                disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
