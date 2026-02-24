import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrgAnalytics, type TimeRange, type OrgFilter } from '@/hooks/analytics/useOrgAnalytics';
import { TimeRangeSelector } from './TimeRangeSelector';
import { OrgFilterBar } from './OrgFilterBar';
import { CategoryHealthChart } from './CategoryHealthChart';
import { SubcategoryChart } from './SubcategoryChart';
import { AffectiveStateChart } from './AffectiveStateChart';
import { ResponseHeatmap } from './ResponseHeatmap';
import { RiskTrendChart } from './RiskTrendChart';
import { OrgComparisonChart } from './OrgComparisonChart';
import { TopEngagersCard } from './TopEngagersCard';
import { ExecutiveSummary } from './ExecutiveSummary';
import { CategoryMoodMatrix } from './CategoryMoodMatrix';
import { CheckinPulseCard } from './comparison/CheckinPulseCard';
import { SurveyStructuralCard } from './comparison/SurveyStructuralCard';
import { SynthesisCard } from './comparison/SynthesisCard';
import { DivergenceHeatmap } from './comparison/DivergenceHeatmap';
import { AlertsPanel } from './comparison/AlertsPanel';
import { TrendOverlayChart } from './comparison/TrendOverlayChart';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { CategoryTrendCards } from './CategoryTrendCards';
import { SubcategoryRiskBubble } from './SubcategoryRiskBubble';
import { MoodByCategoryTrend } from './MoodByCategoryTrend';
import { EarlyWarningPanel } from './EarlyWarningPanel';
import { AIInsightsCard } from './AIInsightsCard';
import { CheckinMoodOverTime } from './CheckinMoodOverTime';
import { SupportActionsChart } from './SupportActionsChart';
import { StreakDistribution } from './StreakDistribution';
import { CheckinByOrgUnit } from './CheckinByOrgUnit';
import { Users, Heart, TrendingUp, AlertTriangle, Flame, ClipboardCheck, ChevronDown as _CD } from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, Line, ComposedChart, Area,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

const MOOD_COLORS: Record<string, string> = {
  great: 'hsl(var(--chart-1))',
  good: 'hsl(var(--chart-2))',
  okay: 'hsl(var(--chart-4))',
  struggling: 'hsl(var(--destructive))',
  need_help: 'hsl(var(--destructive))',
};

const GLASS_TOOLTIP = {
  background: 'hsl(var(--card) / 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid hsl(var(--border) / 0.25)',
  borderRadius: '12px',
  fontSize: 12,
  boxShadow: '0 8px 32px hsl(0 0% 0% / 0.08)',
};

export function OrgDashboard() {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [customStart, setCustomStart] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [orgFilter, setOrgFilter] = useState<OrgFilter>({});

  const { data: stats, isLoading } = useOrgAnalytics(timeRange, customStart, customEnd, orgFilter);

  const statCards = [
    { title: t('orgDashboard.activeEmployees'), value: stats?.activeEmployees ?? 0, icon: Users },
    { title: t('orgDashboard.teamWellness'), value: stats?.avgMoodScore ? `${stats.avgMoodScore}/5` : '—', icon: Heart },
    { title: t('orgDashboard.participation'), value: stats?.participationRate !== undefined ? `${stats.participationRate}%` : '—', icon: TrendingUp },
    { title: t('orgDashboard.surveyResponseRate'), value: stats?.surveyResponseRate !== undefined ? `${stats.surveyResponseRate}%` : '—', icon: ClipboardCheck },
    { title: t('orgDashboard.riskIndicator'), value: stats?.riskPercentage !== undefined ? `${stats.riskPercentage}%` : '—', icon: AlertTriangle },
    { title: t('orgDashboard.engagementStreak'), value: stats?.avgStreak ? `${stats.avgStreak}d` : '—', icon: Flame },
  ];

  const trendData = (stats?.moodTrend ?? [])
    .filter(d => d.count > 0 || d.responseCount > 0)
    .map(d => ({ ...d, label: format(parseISO(d.date), 'dd/MM') }));

  const distributionData = (stats?.moodDistribution ?? []).map(d => ({
    name: t(`orgDashboard.moods.${d.level}`, d.level),
    value: d.count,
    percentage: d.percentage,
    fill: MOOD_COLORS[d.level] ?? 'hsl(var(--muted))',
  }));

  const aiPayload = stats ? {
    activeEmployees: stats.activeEmployees,
    avgMoodScore: stats.avgMoodScore,
    participationRate: stats.participationRate,
    riskPercentage: stats.riskPercentage,
    healthScore: stats.compositeHealthScore,
    topRisks: stats.categoryRiskScores?.slice(0, 3).map(r => ({ name: r.name, riskScore: r.riskScore, trend: r.trend })),
    warnings: stats.earlyWarnings?.slice(0, 5).map(w => ({ type: w.type, area: w.area, severity: w.severity })),
    periodComparison: stats.periodComparison,
  } : null;

  return (
    <div className="space-y-6">
      {/* Header + Time Range */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('orgDashboard.title')}</h1>
          <p className="text-muted-foreground">{t('orgDashboard.subtitle')}</p>
        </div>
        <TimeRangeSelector
          value={timeRange}
          onChange={setTimeRange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
        />
      </div>

      {/* Org Filters */}
      <OrgFilterBar value={orgFilter} onChange={setOrgFilter} />

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-stat border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium truncate">{stat.title}</CardTitle>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <stat.icon className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-bold">{stat.value}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass-card border-0 p-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">{t('orgDashboard.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="deep" className="rounded-lg data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">{t('orgDashboard.tabs.deepAnalysis')}</TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">{t('orgDashboard.tabs.alertsInsights')}</TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-lg data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">{t('orgDashboard.tabs.comparison')}</TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4">
          <ExecutiveSummary
            healthScore={stats?.compositeHealthScore ?? 0}
            periodComparison={stats?.periodComparison ?? null}
            warnings={stats?.earlyWarnings ?? []}
            isLoading={isLoading}
          />

          {/* Engagement Trend */}
          <Card className="glass-chart border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('orgDashboard.engagementTrend')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[240px] w-full" />
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={trendData}>
                    <defs>
                      <linearGradient id="orgMoodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" domain={[1, 5]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={GLASS_TOOLTIP} />
                    <Area yAxisId="left" type="monotone" dataKey="avg" name={t('orgDashboard.moodAvg')} stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#orgMoodGradient)" dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }} activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }} />
                    <Line yAxisId="right" type="monotone" dataKey="responseCount" name={t('orgDashboard.surveyResponses')} stroke="hsl(var(--chart-4))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-10">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>

          <RiskTrendChart data={stats?.riskTrend ?? []} isLoading={isLoading} />

          <div className="grid gap-4 md:grid-cols-2">
            <CategoryHealthChart data={stats?.categoryScores ?? []} isLoading={isLoading} />
            <AffectiveStateChart data={stats?.affectiveDistribution ?? []} isLoading={isLoading} />
          </div>

          <TopEngagersCard data={stats?.topEngagers ?? []} isLoading={isLoading} />
        </TabsContent>

        {/* ── Deep Analysis Tab ── */}
        <TabsContent value="deep" className="space-y-4">
          <Tabs defaultValue="checkin" className="space-y-4">
            <TabsList className="glass-card border-0 p-1">
              <TabsTrigger value="checkin" className="rounded-lg data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">{t('orgDashboard.checkinAnalysis')}</TabsTrigger>
              <TabsTrigger value="survey" className="rounded-lg data-[state=active]:glass-active data-[state=active]:text-primary data-[state=active]:shadow-none">{t('orgDashboard.surveyAnalysis')}</TabsTrigger>
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
        </TabsContent>

        {/* ── Alerts & Insights Tab ── */}
        <TabsContent value="alerts" className="space-y-4">
          <EarlyWarningPanel warnings={stats?.earlyWarnings ?? []} isLoading={isLoading} />
          <AIInsightsCard analyticsData={aiPayload} isLoading={isLoading} />
        </TabsContent>

        {/* ── Comparison Tab ── */}
        <TabsContent value="comparison" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
