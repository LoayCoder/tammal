import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCheckinMonitor, type DateRange } from '@/hooks/analytics/useCheckinMonitor';
import type { OrgFilters } from '@/hooks/analytics/useSurveyMonitor';
import { OrgFilterBar } from '@/components/survey-monitor/OrgFilterBar';
import { CheckinOverview } from '@/components/checkin-monitor/CheckinOverview';
import { MoodDistributionBar } from '@/components/checkin-monitor/MoodDistributionBar';
import { CheckinDepartmentHeatmap } from '@/components/checkin-monitor/CheckinDepartmentHeatmap';
import { CheckinEmployeeTable } from '@/components/checkin-monitor/CheckinEmployeeTable';
import { CheckinTrendChart } from '@/components/checkin-monitor/CheckinTrendChart';
import { CheckinRiskPanel } from '@/components/checkin-monitor/CheckinRiskPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';

export default function CheckinMonitor() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [orgFilters, setOrgFilters] = useState<OrgFilters>({});

  const {
    participationStats,
    moodBreakdown,
    departmentStats,
    employeeList,
    trendData,
    riskAlerts,
    isPending: isLoading,
  } = useCheckinMonitor(tenantId ?? undefined, dateRange, orgFilters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card border-0 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            {t('checkinMonitor.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('checkinMonitor.subtitle')}
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="w-full sm:w-48">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{t('checkinMonitor.dateRange.today')}</SelectItem>
              <SelectItem value="7d">{t('checkinMonitor.dateRange.7d')}</SelectItem>
              <SelectItem value="30d">{t('checkinMonitor.dateRange.30d')}</SelectItem>
              <SelectItem value="ytd">{t('checkinMonitor.dateRange.ytd')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Org Filters */}
      <OrgFilterBar filters={orgFilters} onChange={setOrgFilters} />

      {/* Participation Overview */}
      <CheckinOverview stats={participationStats} isLoading={isLoading} />

      {/* Mood Distribution */}
      <MoodDistributionBar breakdown={moodBreakdown} />

      {/* Two-column: Heatmap + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CheckinDepartmentHeatmap departments={departmentStats} isLoading={isLoading} />
        <CheckinRiskPanel alerts={riskAlerts} />
      </div>

      {/* Employee Table */}
      <CheckinEmployeeTable employees={employeeList} isLoading={isLoading} />

      {/* Trend Chart */}
      {dateRange !== 'today' && (
        <CheckinTrendChart trendData={trendData} isLoading={isLoading} />
      )}
    </div>
  );
}
