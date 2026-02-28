// ── usePulseMetrics — granular React Query hook ──
// Wraps Three-Layer Intelligence: Check-in Pulse, Survey Structural, BAI Synthesis.
// Pure computation layer — no direct Supabase calls in synthesis functions.

import { useQuery } from '@tanstack/react-query';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useAuth } from '@/hooks/auth/useAuth';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

import type { TimeRange, OrgFilter } from '@/lib/analytics/types';
import {
  hasOrgFilter, resolveFilteredEmployeeIds,
  fetchMoodEntries, fetchActiveEmployeeCount,
  fetchSurveyResponseRate, fetchResponseDailyMap,
  computeOrgComparison, fetchCategoryAnalysis,
  computeCategoryTrendsAndMatrix, computeTrendOverlay,
} from '@/lib/analytics/queries';
import { computeKPIs, computeDailyTrend } from '@/lib/analytics/computations';
import { computeCategoryRiskScores } from '@/lib/analytics/computations/riskScore';
import { computeCheckinPulse, computeSurveyStructural, computeSynthesis } from '@/lib/analytics/synthesis';

export function usePulseMetrics(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();
  const { tenantId } = useTenantId();

  return useQuery({
    queryKey: [
      'analytics', tenantId, 'pulse',
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
            checkinPulse: { volatilityIndex: 0, participationStability: 0, energyTrend: 'stable' as const, topEmotionCluster: 'okay' },
            surveyStructural: { categoryHealthScore: 0, lowestCategory: null, participationQuality: 0, riskCategoryCount: 0 },
            synthesisData: {
              baiScore: 0, divergenceLevel: 'high_alignment' as const, riskClassification: 'green' as const,
              confidenceScore: 0, recommendedActionKey: 'synthesis.actions.maintain', alerts: [],
              branchBAI: [], divisionBAI: [], departmentBAI: [], sectionBAI: [],
            },
            trendOverlayData: [],
          };
        }
      }

      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

      const [totalActive, entries, surveyResponseRate, { responseDailyMap }] = await Promise.all([
        fetchActiveEmployeeCount(filteredIds),
        fetchMoodEntries(startDate, endDate, filteredIds),
        fetchSurveyResponseRate(startDate, endDate, filteredIds),
        fetchResponseDailyMap(startDate, endDate, filteredIds),
      ]);

      const { avgMoodScore, participationRate } = computeKPIs(entries, totalActive);
      const { dailyMap } = computeDailyTrend(entries, allDays, responseDailyMap);

      const [orgComparison, catAnalysis] = await Promise.all([
        computeOrgComparison(entries, filteredIds),
        fetchCategoryAnalysis(startDate, endDate, filteredIds),
      ]);

      const { categoryScores, catResponses } = catAnalysis;
      const { categoryTrends, catNegMap } = await computeCategoryTrendsAndMatrix(
        categoryScores, catResponses, entries, allDays, startDate, endDate, filteredIds,
      );

      const categoryRiskScores = computeCategoryRiskScores(
        categoryScores,
        categoryScores.map(c => categoryTrends.get(c.id) ?? []),
        catNegMap,
      );

      const checkinPulse = computeCheckinPulse(entries);
      const surveyStructural = computeSurveyStructural(categoryScores, categoryRiskScores, surveyResponseRate);

      const mapUnit = (units: typeof orgComparison.departments) => units.map(d => ({
        id: d.id, name: d.name, nameAr: d.nameAr,
        checkinAvg: d.avgScore, surveyAvg: surveyStructural.categoryHealthScore,
        employeeCount: d.employeeCount,
      }));

      const totalCatResponses = categoryScores.reduce((s, c) => s + c.responseCount, 0);
      const synthesisData = computeSynthesis(
        checkinPulse, surveyStructural,
        avgMoodScore, participationRate, surveyResponseRate,
        entries.length, totalCatResponses,
        {
          branches: mapUnit(orgComparison.branches),
          divisions: mapUnit(orgComparison.divisions),
          departments: mapUnit(orgComparison.departments),
          sections: mapUnit(orgComparison.sections),
        },
      );

      const trendOverlayData = computeTrendOverlay(allDays, dailyMap, responseDailyMap, surveyStructural.categoryHealthScore);

      return { checkinPulse, surveyStructural, synthesisData, trendOverlayData };
    },
    enabled: !!user?.id && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
