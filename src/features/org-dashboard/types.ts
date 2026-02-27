// ── Org Dashboard feature types ──
// Re-exports from analytics for convenience + feature-local UI types.

import type { LucideIcon } from 'lucide-react';

export type { TimeRange, OrgFilter, OrgAnalyticsData } from '@/lib/analytics/types';

export interface StatCard {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export interface TrendDataPoint {
  date: string;
  avg: number;
  count: number;
  responseCount: number;
  label: string;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}

export interface AIPayload {
  activeEmployees: number;
  avgMoodScore: number;
  participationRate: number;
  riskPercentage: number;
  healthScore: number;
  topRisks?: { name: string; riskScore: number; trend: string }[];
  warnings?: { type: string; area: string; severity: string }[];
  periodComparison: any;
}
