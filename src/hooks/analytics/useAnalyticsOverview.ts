// ── useAnalyticsOverview — granular React Query hook ──
// Wraps core overview fetches: active employees, mood entries, survey rate, response daily map.
// Exposes computed KPIs, mood distribution, daily trend, and period comparison.

import { useQuery } from '@tanstack/react-query';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

import type { TimeRange, OrgFilter } from '@/lib/analytics/types';
import {
  hasOrgFilter, resolveFilteredEmployeeIds,
  fetchMoodEntries, fetchActiveEmployeeCount,
  fetchSurveyResponseRate, fetchResponseDailyMap,
  fetchPreviousPeriodComparison,
} from '@/lib/analytics/queries';
import { computeKPIs, computeStreaks, computeMoodDistribution, computeDailyTrend } from '@/lib/analytics/computations';
import { computeHealthScore } from '@/lib/analytics/computations/riskScore';

export function useAnalyticsOverview(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: [
      'analytics', tenantId, 'overview',
      timeRange, customStart, customEnd,
      orgFilter?.branchId, orgFilter?.divisionId,
      orgFilter?.departmentId, orgFilter?.sectionId,
    ],
    queryFn: async () => {
      // ── Date range ──
      let startDate: string, endDate: string, rangeStart: Date, rangeEnd: Date;
      if (timeRange === 'custom' && customStart && customEnd) {
        startDate = customStart; endDate = customEnd;
        rangeStart = parseISO(customStart); rangeEnd = parseISO(customEnd);
      } else {
        const days = typeof timeRange === 'number' ? timeRange : 30;
        rangeEnd = new Date(); rangeStart = subDays(rangeEnd, days);
        startDate = format(rangeStart, 'yyyy-MM-dd');
        endDate = format(rangeEnd, 'yyyy-MM-dd');
      }

      // ── Org filter ──
      let filteredIds: string[] | null = null;
      if (hasOrgFilter(orgFilter)) {
        filteredIds = await resolveFilteredEmployeeIds(orgFilter!);
        if (filteredIds.length === 0) return null;
      }

      // ── Parallel core fetches ──
      const [totalActive, entries, surveyResponseRate, { responseDailyMap }] = await Promise.all([
        fetchActiveEmployeeCount(filteredIds),
        fetchMoodEntries(startDate, endDate, filteredIds),
        fetchSurveyResponseRate(startDate, endDate, filteredIds),
        fetchResponseDailyMap(startDate, endDate, filteredIds),
      ]);

      const { avgMoodScore, participationRate, riskPercentage } = computeKPIs(entries, totalActive);
      const { avgStreak } = computeStreaks(entries);
      const moodDistribution = computeMoodDistribution(entries);
      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      const { moodTrend } = computeDailyTrend(entries, allDays, responseDailyMap);
      const compositeHealthScore = computeHealthScore(avgMoodScore, participationRate, riskPercentage);

      const periodComparison = await fetchPreviousPeriodComparison(
        rangeStart, rangeEnd, filteredIds,
        { avgMood: avgMoodScore, participation: participationRate, risk: riskPercentage },
        totalActive,
      );

      return {
        activeEmployees: totalActive,
        avgMoodScore,
        participationRate,
        surveyResponseRate,
        riskPercentage,
        avgStreak,
        moodTrend,
        moodDistribution,
        compositeHealthScore,
        periodComparison,
      };
    },
    enabled: !!user?.id && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
