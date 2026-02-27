// ── useOrgDashboard — thin orchestrator for OrgDashboard feature ──
// Owns filter state + delegates to useOrgAnalytics + memoizes derived data.

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import { useOrgAnalytics } from '@/hooks/analytics/useOrgAnalytics';
import type { TimeRange, OrgFilter } from '@/lib/analytics/types';
import { buildStatCards, buildTrendData, buildDistributionData, buildAIPayload } from '../utils/transforms';

export function useOrgDashboard() {
  const { t } = useTranslation();

  // ── Filter state ──
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [customStart, setCustomStart] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [orgFilter, setOrgFilter] = useState<OrgFilter>({});

  const handleCustomChange = useCallback((s: string, e: string) => {
    setCustomStart(s);
    setCustomEnd(e);
  }, []);

  // ── Data ──
  const { data: stats, isLoading } = useOrgAnalytics(timeRange, customStart, customEnd, orgFilter);

  // ── Memoized derived data ──
  const statCards = useMemo(() => buildStatCards(stats, t), [stats, t]);
  const trendData = useMemo(() => buildTrendData(stats), [stats]);
  const distributionData = useMemo(() => buildDistributionData(stats, t), [stats, t]);
  const aiPayload = useMemo(() => buildAIPayload(stats), [stats]);

  return {
    // Filter controls
    timeRange, setTimeRange,
    customStart, customEnd, handleCustomChange,
    orgFilter, setOrgFilter,
    // Data
    stats, isLoading,
    // Derived
    statCards, trendData, distributionData, aiPayload,
  };
}
