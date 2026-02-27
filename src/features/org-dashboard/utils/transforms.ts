// ── Pure data transforms for OrgDashboard ──
// No React imports. No side effects.

import { format, parseISO } from 'date-fns';
import type { TFunction } from 'i18next';
import type { OrgAnalyticsData } from '@/lib/analytics/types';
import type { StatCard, TrendDataPoint, DistributionDataPoint, AIPayload } from '../types';
import { Users, Heart, TrendingUp, AlertTriangle, Flame, ClipboardCheck } from 'lucide-react';

const MOOD_COLORS: Record<string, string> = {
  great: 'hsl(var(--chart-1))',
  good: 'hsl(var(--chart-2))',
  okay: 'hsl(var(--chart-4))',
  struggling: 'hsl(var(--destructive))',
  need_help: 'hsl(var(--destructive))',
};

export function buildStatCards(stats: OrgAnalyticsData | undefined, t: TFunction): StatCard[] {
  return [
    { title: t('orgDashboard.activeEmployees'), value: stats?.activeEmployees ?? 0, icon: Users },
    { title: t('orgDashboard.teamWellness'), value: stats?.avgMoodScore ? `${stats.avgMoodScore}/5` : '—', icon: Heart },
    { title: t('orgDashboard.participation'), value: stats?.participationRate !== undefined ? `${stats.participationRate}%` : '—', icon: TrendingUp },
    { title: t('orgDashboard.surveyResponseRate'), value: stats?.surveyResponseRate !== undefined ? `${stats.surveyResponseRate}%` : '—', icon: ClipboardCheck },
    { title: t('orgDashboard.riskIndicator'), value: stats?.riskPercentage !== undefined ? `${stats.riskPercentage}%` : '—', icon: AlertTriangle },
    { title: t('orgDashboard.engagementStreak'), value: stats?.avgStreak ? `${stats.avgStreak}d` : '—', icon: Flame },
  ];
}

export function buildTrendData(stats: OrgAnalyticsData | undefined): TrendDataPoint[] {
  return (stats?.moodTrend ?? [])
    .filter(d => d.count > 0 || d.responseCount > 0)
    .map(d => ({ ...d, label: format(parseISO(d.date), 'dd/MM') }));
}

export function buildDistributionData(stats: OrgAnalyticsData | undefined, t: TFunction): DistributionDataPoint[] {
  return (stats?.moodDistribution ?? []).map(d => ({
    name: t(`orgDashboard.moods.${d.level}`, d.level),
    value: d.count,
    percentage: d.percentage,
    fill: MOOD_COLORS[d.level] ?? 'hsl(var(--muted))',
  }));
}

export function buildAIPayload(stats: OrgAnalyticsData | undefined): AIPayload | null {
  if (!stats) return null;
  return {
    activeEmployees: stats.activeEmployees,
    avgMoodScore: stats.avgMoodScore,
    participationRate: stats.participationRate,
    riskPercentage: stats.riskPercentage,
    healthScore: stats.compositeHealthScore,
    topRisks: stats.categoryRiskScores?.slice(0, 3).map(r => ({ name: r.name, riskScore: r.riskScore, trend: r.trend })),
    warnings: stats.earlyWarnings?.slice(0, 5).map(w => ({ type: w.type, area: w.area, severity: w.severity })),
    periodComparison: stats.periodComparison,
  };
}
