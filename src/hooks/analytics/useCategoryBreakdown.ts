// ── useCategoryBreakdown — granular React Query hook ──
// Wraps fetchCategoryAnalysis for category-level scores and affective distribution.

import { useQuery } from '@tanstack/react-query';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { subDays, format, parseISO } from 'date-fns';

import type { TimeRange, OrgFilter } from '@/lib/analytics/types';
import { hasOrgFilter, resolveFilteredEmployeeIds, fetchCategoryAnalysis } from '@/lib/analytics/queries';

export function useCategoryBreakdown(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: [
      'analytics', tenantId, 'category',
      timeRange, customStart, customEnd,
      orgFilter?.branchId, orgFilter?.divisionId,
      orgFilter?.departmentId, orgFilter?.sectionId,
    ],
    queryFn: async () => {
      let startDate: string, endDate: string;
      if (timeRange === 'custom' && customStart && customEnd) {
        startDate = customStart; endDate = customEnd;
      } else {
        const days = typeof timeRange === 'number' ? timeRange : 30;
        const rangeEnd = new Date();
        startDate = format(subDays(rangeEnd, days), 'yyyy-MM-dd');
        endDate = format(rangeEnd, 'yyyy-MM-dd');
      }

      let filteredIds: string[] | null = null;
      if (hasOrgFilter(orgFilter)) {
        filteredIds = await resolveFilteredEmployeeIds(orgFilter!);
        if (filteredIds.length === 0) return { categoryScores: [], affectiveDistribution: [] };
      }

      const { categoryScores, affectiveDistribution } = await fetchCategoryAnalysis(startDate, endDate, filteredIds);
      return { categoryScores, affectiveDistribution };
    },
    enabled: !!user?.id && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
