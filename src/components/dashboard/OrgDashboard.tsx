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
        <TabsList className="h-auto bg-muted/6 rounded-full p-1 gap-1 border-0">
          <TabsTrigger value="overview" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">{t('orgDashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="deep" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">{t('orgDashboard.tabs.deepAnalysis')}</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">{t('orgDashboard.tabs.alertsInsights')}</TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">{t('orgDashboard.tabs.comparison')}</TabsTrigger>
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
