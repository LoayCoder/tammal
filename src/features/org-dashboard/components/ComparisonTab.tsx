import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell,
} from 'recharts';
import { CheckinPulseCard } from '@/components/dashboard/comparison/CheckinPulseCard';
import { SurveyStructuralCard } from '@/components/dashboard/comparison/SurveyStructuralCard';
import { SynthesisCard } from '@/components/dashboard/comparison/SynthesisCard';
import { DivergenceHeatmap } from '@/components/dashboard/comparison/DivergenceHeatmap';
import { AlertsPanel } from '@/components/dashboard/comparison/AlertsPanel';
import { TrendOverlayChart } from '@/components/dashboard/comparison/TrendOverlayChart';
import { OrgComparisonChart } from '@/components/dashboard/OrgComparisonChart';
import { TopEngagersCard } from '@/components/dashboard/TopEngagersCard';
import { ResponseHeatmap } from '@/components/dashboard/ResponseHeatmap';
import type { OrgAnalyticsData } from '@/lib/analytics/types';
import type { DistributionDataPoint } from '../types';

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
};

interface Props {
  stats: OrgAnalyticsData | undefined;
  distributionData: DistributionDataPoint[];
  isLoading: boolean;
}

export const ComparisonTab = React.memo(function ComparisonTab({ stats, distributionData, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <CheckinPulseCard data={stats?.checkinPulse ?? null} isLoading={isLoading} />
        <SurveyStructuralCard data={stats?.surveyStructural ?? null} isLoading={isLoading} />
      </div>

      <SynthesisCard data={stats?.synthesisData ?? null} isLoading={isLoading} />

      <DivergenceHeatmap
        branchData={stats?.synthesisData?.branchBAI ?? []}
        divisionData={stats?.synthesisData?.divisionBAI ?? []}
        departmentData={stats?.synthesisData?.departmentBAI ?? []}
        sectionData={stats?.synthesisData?.sectionBAI ?? []}
        isLoading={isLoading}
      />

      <AlertsPanel alerts={stats?.synthesisData?.alerts ?? []} isLoading={isLoading} />

      <TrendOverlayChart data={stats?.trendOverlayData ?? []} isLoading={isLoading} />

      {/* Collapsible Org Breakdown */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2">
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
          {t('synthesis.orgBreakdown')}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <OrgComparisonChart
            data={stats?.orgComparison ?? { branches: [], divisions: [], departments: [], sections: [] }}
            isLoading={isLoading}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass-chart border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('orgDashboard.moodDistribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : distributionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={distributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                      <Tooltip contentStyle={GLASS_TOOLTIP} formatter={(value: number, _name: string, props: any) => [`${value} (${props.payload.percentage}%)`, t('orgDashboard.count')]} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>
            <TopEngagersCard data={stats?.topEngagers ?? []} isLoading={isLoading} />
          </div>
          <ResponseHeatmap data={stats?.dayOfWeekActivity ?? []} isLoading={isLoading} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
});
