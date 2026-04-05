import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OrgFilterBar } from './OrgFilterBar';
import { ErrorBoundary } from '@/shared/resilience/ErrorBoundary';
import {
  useOrgDashboard,
  DashboardHeader,
  StatCards,
  OverviewTab,
  DeepAnalysisTab,
  AlertsTab,
  ComparisonTab,
} from '@/features/org-dashboard';
import { OrgWorkloadIndicator } from '@/features/org-dashboard/components/OrgWorkloadIndicator';
import { TeamPulseCard } from '@/features/team-pulse';
import { WellnessCopilotCard } from '@/features/wellness-copilot';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';

export function OrgDashboard() {
  const { t } = useTranslation();
  const { employee } = useCurrentEmployee();
  const {
    timeRange, setTimeRange,
    customStart, customEnd, handleCustomChange,
    orgFilter, setOrgFilter,
    stats, isLoading,
    statCards, trendData, distributionData, aiPayload,
  } = useOrgDashboard();

  return (
    <div className="space-y-8">
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomChange={handleCustomChange}
      />

      <OrgFilterBar value={orgFilter} onChange={setOrgFilter} />

      <StatCards cards={statCards} isLoading={isLoading} />

      <ErrorBoundary><OrgWorkloadIndicator /></ErrorBoundary>

      {employee?.id && (
        <>
          <ErrorBoundary><TeamPulseCard employeeId={employee.id} /></ErrorBoundary>
          <ErrorBoundary><WellnessCopilotCard employeeId={employee.id} /></ErrorBoundary>
        </>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto gap-1">
          <TabsTrigger value="overview">{t('orgDashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="deep">{t('orgDashboard.tabs.deepAnalysis')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('orgDashboard.tabs.alertsInsights')}</TabsTrigger>
          <TabsTrigger value="comparison">{t('orgDashboard.tabs.comparison')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in-0 duration-200">
          <ErrorBoundary><OverviewTab stats={stats} trendData={trendData} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>

        <TabsContent value="deep" className="animate-in fade-in-0 duration-200">
          <ErrorBoundary><DeepAnalysisTab stats={stats} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>

        <TabsContent value="alerts" className="animate-in fade-in-0 duration-200">
          <ErrorBoundary><AlertsTab warnings={stats?.earlyWarnings ?? []} aiPayload={aiPayload} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>

        <TabsContent value="comparison" className="animate-in fade-in-0 duration-200">
          <ErrorBoundary><ComparisonTab stats={stats} distributionData={distributionData} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
