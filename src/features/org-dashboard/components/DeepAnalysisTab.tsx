import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckinMoodOverTime } from '@/components/dashboard/CheckinMoodOverTime';
import { SupportActionsChart } from '@/components/dashboard/SupportActionsChart';
import { StreakDistribution } from '@/components/dashboard/StreakDistribution';
import { CheckinByOrgUnit } from '@/components/dashboard/CheckinByOrgUnit';
import { CategoryTrendCards } from '@/components/dashboard/CategoryTrendCards';
import { CategoryMoodMatrix } from '@/components/dashboard/CategoryMoodMatrix';
import { SubcategoryRiskBubble } from '@/components/dashboard/SubcategoryRiskBubble';
import { MoodByCategoryTrend } from '@/components/dashboard/MoodByCategoryTrend';
import { SubcategoryChart } from '@/components/dashboard/SubcategoryChart';
import type { OrgAnalyticsData } from '@/lib/analytics/types';

interface Props {
  stats: OrgAnalyticsData | undefined;
  isLoading: boolean;
}

export const DeepAnalysisTab = React.memo(function DeepAnalysisTab({ stats, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <Tabs defaultValue="checkin" className="space-y-4">
      <TabsList className="glass-tabs border-0 h-auto">
        <TabsTrigger value="checkin" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">{t('orgDashboard.checkinAnalysis')}</TabsTrigger>
        <TabsTrigger value="survey" className="rounded-xl px-4 py-2.5 text-sm font-medium data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200">{t('orgDashboard.surveyAnalysis')}</TabsTrigger>
      </TabsList>

      <TabsContent value="checkin" className="space-y-4">
        <CheckinMoodOverTime data={stats?.checkinMoodOverTime ?? []} isLoading={isLoading} />
        <div className="grid gap-4 md:grid-cols-2">
          <SupportActionsChart data={stats?.supportActionCounts ?? []} isLoading={isLoading} />
          <StreakDistribution data={stats?.streakDistribution ?? []} isLoading={isLoading} />
        </div>
        <CheckinByOrgUnit data={stats?.checkinByOrgUnit ?? []} orgAvgScore={stats?.avgMoodScore ?? 0} isLoading={isLoading} />
      </TabsContent>

      <TabsContent value="survey" className="space-y-4">
        <CategoryTrendCards
          risks={stats?.categoryRiskScores ?? []}
          trends={stats?.categoryTrends ?? new Map()}
          isLoading={isLoading}
        />
        <CategoryMoodMatrix data={stats?.categoryMoodMatrix ?? []} isLoading={isLoading} />
        <SubcategoryRiskBubble
          data={(stats?.subcategoryScores ?? []).map(s => ({ ...s, declineRate: 0 }))}
          isLoading={isLoading}
        />
        <MoodByCategoryTrend
          categories={stats?.categoryScores ?? []}
          moodByCategoryData={stats?.moodByCategoryData ?? new Map()}
          isLoading={isLoading}
        />
        <SubcategoryChart data={stats?.subcategoryScores ?? []} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
});
