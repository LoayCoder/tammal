// ── useStructuralAnalysis — granular React Query hook ──
// Wraps org comparison, top engagers, category trends, and category mood matrix.

import { useQuery } from '@tanstack/react-query';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

import type { TimeRange, OrgFilter } from '@/lib/analytics/types';
import {
  hasOrgFilter, resolveFilteredEmployeeIds,
  fetchMoodEntries, computeOrgComparison, computeTopEngagers,
  fetchCategoryAnalysis, computeCategoryTrendsAndMatrix,
} from '@/lib/analytics/queries';

export function useStructuralAnalysis(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: [
      'analytics', tenantId, 'structural',
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
          return {
            orgComparison: { branches: [], divisions: [], departments: [], sections: [] },
            topEngagers: [],
            categoryTrends: new Map(),
            categoryMoodMatrix: [],
            moodByCategoryData: new Map(),
          };
        }
      }

      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      const entries = await fetchMoodEntries(startDate, endDate, filteredIds);

      const [orgComparison, topEngagers, catAnalysis] = await Promise.all([
        computeOrgComparison(entries, filteredIds),
        computeTopEngagers(entries, filteredIds, startDate, endDate),
        fetchCategoryAnalysis(startDate, endDate, filteredIds),
      ]);

      const { categoryScores, catResponses } = catAnalysis;
      const { categoryTrends, categoryMoodMatrix, moodByCategoryData } =
        await computeCategoryTrendsAndMatrix(
          categoryScores, catResponses, entries, allDays, startDate, endDate, filteredIds,
        );

      return { orgComparison, topEngagers, categoryTrends, categoryMoodMatrix, moodByCategoryData };
    },
    enabled: !!user?.id && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
