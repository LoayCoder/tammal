// ── useRiskIndicators — granular React Query hook ──
// Wraps risk trend computation, category risk scores, and early warnings.

import { useQuery } from '@tanstack/react-query';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

import type { TimeRange, OrgFilter } from '@/lib/analytics/types';
import {
  hasOrgFilter, resolveFilteredEmployeeIds,
  fetchMoodEntries, fetchActiveEmployeeCount,
  fetchCategoryAnalysis, computeCategoryTrendsAndMatrix,
} from '@/lib/analytics/queries';
import { computeKPIs, computeRiskTrend } from '@/lib/analytics/computations';
import { computeCategoryRiskScores, detectEarlyWarnings } from '@/lib/analytics/computations/riskScore';

export function useRiskIndicators(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: [
      'analytics', tenantId, 'risk',
      timeRange, customStart, customEnd,
      orgFilter?.branchId, orgFilter?.divisionId,
      orgFilter?.departmentId, orgFilter?.sectionId,
    ],
    queryFn: async () => {
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

      let filteredIds: string[] | null = null;
      if (hasOrgFilter(orgFilter)) {
        filteredIds = await resolveFilteredEmployeeIds(orgFilter!);
        if (filteredIds.length === 0) {
          return { riskTrend: [], categoryRiskScores: [], earlyWarnings: [] };
        }
      }

      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

      const [totalActive, entries, catAnalysis] = await Promise.all([
        fetchActiveEmployeeCount(filteredIds),
        fetchMoodEntries(startDate, endDate, filteredIds),
        fetchCategoryAnalysis(startDate, endDate, filteredIds),
      ]);

      const { participationRate } = computeKPIs(entries, totalActive);
      const riskTrend = computeRiskTrend(entries, allDays);

      const { categoryScores, catResponses } = catAnalysis;
      const { categoryTrends, catNegMap } = await computeCategoryTrendsAndMatrix(
        categoryScores, catResponses, entries, allDays, startDate, endDate, filteredIds,
      );

      const categoryRiskScores = computeCategoryRiskScores(
        categoryScores,
        categoryScores.map(c => categoryTrends.get(c.id) ?? []),
        catNegMap,
      );

      const earlyWarnings = detectEarlyWarnings(
        categoryRiskScores, categoryTrends, participationRate, riskTrend,
      );

      return { riskTrend, categoryRiskScores, earlyWarnings };
    },
    enabled: !!user?.id && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
