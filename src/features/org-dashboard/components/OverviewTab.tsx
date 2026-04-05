import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Line, ComposedChart, Area,
} from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
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

function CollapsibleCard({ title, children, cardKey }: { title: string; children: React.ReactNode; cardKey: string }) {
  const [visible, setVisible] = useState(true);
  const toggle = useCallback(() => setVisible(v => !v), []);

  return (
    <div className="transition-all duration-200">
      {!visible ? (
        <button
          onClick={toggle}
          className={`${cardVariants.glass} rounded-2xl p-4 w-full flex items-center justify-between text-start hover:bg-muted/30 transition-colors`}
        >
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="relative overflow-visible">
          <button
            onClick={toggle}
            className="absolute top-3 end-3 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted/50 bg-muted/30 md:bg-transparent"
            aria-label="Hide"
          >
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {children}
        </div>
      )}
    </div>
  );
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
      <CollapsibleCard title={t('orgDashboard.engagementTrend')} cardKey="engagement">
        <Card className={`${cardVariants.glass} rounded-2xl`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('orgDashboard.engagementTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {isLoading ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="orgMoodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} strokeOpacity={0.4} />
                  <XAxis dataKey="label" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} padding={{ top: 20, bottom: 20 }} tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={24} />
                  <YAxis yAxisId="right" orientation="right" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={GLASS_TOOLTIP} />
                  <Area yAxisId="left" type="natural" dataKey="avg" name={t('orgDashboard.moodAvg')} stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#orgMoodGradient)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 5, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }} />
                  <Line yAxisId="right" type="natural" dataKey="responseCount" name={t('orgDashboard.surveyResponses')} stroke="hsl(var(--chart-4))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyAnalyticsState />
            )}
          </CardContent>
        </Card>
      </CollapsibleCard>

      <CollapsibleCard title={t('orgDashboard.riskTrend')} cardKey="risk">
        <RiskTrendChart data={stats?.riskTrend ?? []} isLoading={isLoading} />
      </CollapsibleCard>

      <div className="grid gap-4 md:grid-cols-2">
        <CollapsibleCard title={t('orgDashboard.categoryHealth')} cardKey="category">
          <CategoryHealthChart data={stats?.categoryScores ?? []} isLoading={isLoading} />
        </CollapsibleCard>
        <CollapsibleCard title={t('orgDashboard.affectiveDistribution')} cardKey="affective">
          <AffectiveStateChart data={stats?.affectiveDistribution ?? []} isLoading={isLoading} />
        </CollapsibleCard>
      </div>

      <CollapsibleCard title={t('orgDashboard.topEngagers', 'Top Engagers')} cardKey="engagers">
        <TopEngagersCard data={stats?.topEngagers ?? []} isLoading={isLoading} />
      </CollapsibleCard>
    </div>
  );
});
