import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useSurveyMonitor } from '@/hooks/analytics/useSurveyMonitor';
import { ParticipationOverview } from '@/components/survey-monitor/ParticipationOverview';
import { DepartmentHeatmap } from '@/components/survey-monitor/DepartmentHeatmap';
import { ParticipationTrend } from '@/components/survey-monitor/ParticipationTrend';
import { SLAIndicator } from '@/components/survey-monitor/SLAIndicator';
import { RiskPanel } from '@/components/survey-monitor/RiskPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

export default function SurveyMonitor() {
  const { t, i18n } = useTranslation();
  const { tenantId } = useTenantId();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('');

  const {
    schedules,
    schedulesLoading,
    stats,
    statsLoading,
    departmentStats,
    departmentStatsLoading,
    snapshots,
    snapshotsLoading,
  } = useSurveyMonitor(selectedScheduleId || undefined, tenantId ?? undefined);

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
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
        <div className="flex items-center justify-center h-48 text-muted-foreground">
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

          {/* Participation Overview Cards */}
          <ParticipationOverview stats={stats} isLoading={statsLoading} />

          {/* Two-column: Heatmap + Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DepartmentHeatmap
              departments={departmentStats}
              isLoading={departmentStatsLoading}
            />
            <RiskPanel departments={departmentStats} />
          </div>

          {/* Trend Chart */}
          <ParticipationTrend snapshots={snapshots} isLoading={snapshotsLoading} />
        </div>
      )}
    </div>
  );
}
