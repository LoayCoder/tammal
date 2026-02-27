import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OrgFilterBar } from './OrgFilterBar';
import {
  useOrgDashboard,
  DashboardHeader,
  StatCards,
  OverviewTab,
  DeepAnalysisTab,
  AlertsTab,
  ComparisonTab,
} from '@/features/org-dashboard';

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-tabs border-0 h-auto">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">{t('orgDashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="deep" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">{t('orgDashboard.tabs.deepAnalysis')}</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">{t('orgDashboard.tabs.alertsInsights')}</TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">{t('orgDashboard.tabs.comparison')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab stats={stats} trendData={trendData} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="deep">
          <DeepAnalysisTab stats={stats} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="alerts">
          <AlertsTab warnings={stats?.earlyWarnings ?? []} aiPayload={aiPayload} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="comparison">
          <ComparisonTab stats={stats} distributionData={distributionData} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
