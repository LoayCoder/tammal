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

export function OrgDashboard() {
  const { t } = useTranslation();
  const {
    timeRange, setTimeRange,
    customStart, customEnd, handleCustomChange,
    orgFilter, setOrgFilter,
    stats, isLoading,
    statCards, trendData, distributionData, aiPayload,
  } = useOrgDashboard();

  return (
    <div className="space-y-6">
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto gap-1">
          <TabsTrigger value="overview">{t('orgDashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="deep">{t('orgDashboard.tabs.deepAnalysis')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('orgDashboard.tabs.alertsInsights')}</TabsTrigger>
          <TabsTrigger value="comparison">{t('orgDashboard.tabs.comparison')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ErrorBoundary><OverviewTab stats={stats} trendData={trendData} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>

        <TabsContent value="deep">
          <ErrorBoundary><DeepAnalysisTab stats={stats} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>

        <TabsContent value="alerts">
          <ErrorBoundary><AlertsTab warnings={stats?.earlyWarnings ?? []} aiPayload={aiPayload} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>

        <TabsContent value="comparison">
          <ErrorBoundary><ComparisonTab stats={stats} distributionData={distributionData} isLoading={isLoading} /></ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
