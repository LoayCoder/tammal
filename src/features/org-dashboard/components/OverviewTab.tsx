import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Line, ComposedChart, Area,
} from 'recharts';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';
import { RiskTrendChart } from '@/components/dashboard/RiskTrendChart';
import { CategoryHealthChart } from '@/components/dashboard/CategoryHealthChart';
import { AffectiveStateChart } from '@/components/dashboard/AffectiveStateChart';
import { TopEngagersCard } from '@/components/dashboard/TopEngagersCard';
import { EmptyAnalyticsState } from './EmptyAnalyticsState';
import type { OrgAnalyticsData } from '@/lib/analytics/types';
import type { TrendDataPoint } from '../types';
import { cardVariants } from '@/theme/tokens';
import { CHART_AXIS_TICK, CHART_GRID_STROKE } from '@/config/chart-styles';

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
  trendData: TrendDataPoint[];
  isLoading: boolean;
}

export const OverviewTab = React.memo(function OverviewTab({ stats, trendData, isLoading }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <ExecutiveSummary
        healthScore={stats?.compositeHealthScore ?? 0}
        periodComparison={stats?.periodComparison ?? null}
        warnings={stats?.earlyWarnings ?? []}
        isLoading={isLoading}
      />

      {/* Engagement Trend */}
      <Card className={`${cardVariants.glass} rounded-2xl`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('orgDashboard.engagementTrend')}</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {isLoading ? (
            <Skeleton className="h-[240px] w-full rounded-xl" />
          ) : trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={trendData}>
                <defs>
                  <linearGradient id="orgMoodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} strokeOpacity={0.4} />
                <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={[1, 5]} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={24} />
                <YAxis yAxisId="right" orientation="right" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={GLASS_TOOLTIP} />
                <Area yAxisId="left" type="natural" dataKey="avg" name={t('orgDashboard.moodAvg')} stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#orgMoodGradient)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 7, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }} />
                <Line yAxisId="right" type="natural" dataKey="responseCount" name={t('orgDashboard.surveyResponses')} stroke="hsl(var(--chart-4))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyAnalyticsState />
          )}
        </CardContent>
      </Card>

      <RiskTrendChart data={stats?.riskTrend ?? []} isLoading={isLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <CategoryHealthChart data={stats?.categoryScores ?? []} isLoading={isLoading} />
        <AffectiveStateChart data={stats?.affectiveDistribution ?? []} isLoading={isLoading} />
      </div>

      <TopEngagersCard data={stats?.topEngagers ?? []} isLoading={isLoading} />
    </div>
  );
});
