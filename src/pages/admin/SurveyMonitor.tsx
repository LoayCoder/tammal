import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useSurveyMonitor, type OrgFilters } from '@/hooks/analytics/useSurveyMonitor';
import { ParticipationOverview } from '@/components/survey-monitor/ParticipationOverview';
import { DepartmentHeatmap } from '@/components/survey-monitor/DepartmentHeatmap';
import { ParticipationTrend } from '@/components/survey-monitor/ParticipationTrend';
import { SLAIndicator } from '@/components/survey-monitor/SLAIndicator';
import { RiskPanel } from '@/components/survey-monitor/RiskPanel';
import { OrgFilterBar } from '@/components/survey-monitor/OrgFilterBar';
import { EmployeeStatusTable } from '@/components/survey-monitor/EmployeeStatusTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

export default function SurveyMonitor() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');
  const [orgFilters, setOrgFilters] = useState<OrgFilters>({});

  const {
    schedules,
    schedulesLoading,
    employeeStats,
    questionStats,
    departmentStats,
    employeeList,
    trendData,
    isPending,
  } = useSurveyMonitor(selectedScheduleId || undefined, tenantId ?? undefined, orgFilters);

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  // Auto-select first survey if only one exists
  if (schedules.length === 1 && !selectedScheduleId && !schedulesLoading) {
    setSelectedScheduleId(schedules[0].id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card border-0 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            {t('surveyMonitor.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('surveyMonitor.subtitle')}
          </p>
        </div>

        {/* Survey Selector */}
        <div className="w-full sm:w-72">
          {schedulesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder={t('surveyMonitor.selectSurvey')} />
              </SelectTrigger>
              <SelectContent>
                {schedules.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.status === 'active' ? ' ✓' : ''}
                  </SelectItem>
                ))}
                {schedules.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {t('surveyMonitor.noSurveys')}
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!selectedScheduleId && (
        <div className="glass-card border-0 rounded-xl flex items-center justify-center h-48 text-muted-foreground">
          {t('surveyMonitor.selectPrompt')}
        </div>
      )}

      {selectedScheduleId && (
        <div className="space-y-6">
          {/* SLA Indicator */}
          <SLAIndicator
            startDate={selectedSchedule?.start_date}
            endDate={selectedSchedule?.end_date}
          />

          {/* Org Filters */}
          <OrgFilterBar filters={orgFilters} onChange={setOrgFilters} />

          {/* Participation Overview Cards */}
          <ParticipationOverview
            employeeStats={employeeStats}
            questionStats={questionStats}
            isLoading={isPending}
          />

          {/* Two-column: Heatmap + Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentHeatmap
              departments={departmentStats}
              isLoading={isPending}
            />
            <RiskPanel departments={departmentStats} />
          </div>

          {/* Employee Status Table */}
          <EmployeeStatusTable employees={employeeList} isLoading={isPending} />

          {/* Trend Chart */}
          <ParticipationTrend trendData={trendData} isLoading={isPending} />
        </div>
      )}
    </div>
  );
}
