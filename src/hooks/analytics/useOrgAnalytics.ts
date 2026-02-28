// ── useOrgAnalytics — thin orchestrator ──────────────────────
// React Query wrapper only. Zero business logic. Zero inline Supabase calls.
// All logic delegated to src/lib/analytics/.

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { subDays, format, eachDayOfInterval, parseISO } from 'date-fns';

// Re-export all types for backward compat
export type {
  TimeRange, OrgFilter, CategoryScore, SubcategoryScore, AffectiveDistribution,
  DayOfWeekActivity, RiskTrendPoint, OrgUnitComparison, OrgComparison, TopEngager,
  CheckinMoodOverTimePoint, SupportActionCount, StreakBucket, CheckinByOrgUnitItem,
  OrgAnalyticsData, TrendOverlayPoint,
} from '@/lib/analytics/types';
export { emptyResult } from '@/lib/analytics/types';

import type { TimeRange, OrgFilter, OrgAnalyticsData } from '@/lib/analytics/types';
import { emptyResult } from '@/lib/analytics/types';

import {
  hasOrgFilter, resolveFilteredEmployeeIds, fetchMoodEntries,
  fetchActiveEmployeeCount, fetchSurveyResponseRate,
  computeOrgComparison, computeTopEngagers,
  fetchCategoryAnalysis, computeCategoryTrendsAndMatrix,
  fetchPreviousPeriodComparison, fetchResponseDailyMap,
  computeTrendOverlay,
} from '@/lib/analytics/queries';

import {
  computeKPIs, computeStreaks, computeMoodDistribution, computeDailyTrend,
  computeDayOfWeekActivity, computeRiskTrend, computeCheckinMoodOverTime,
  computeSupportActions, computeStreakDistribution, computeCheckinByOrgUnit,
  computeCategoryRiskScores, computeHealthScore, detectEarlyWarnings,
} from '@/lib/analytics/computations';

import { computeCheckinPulse, computeSurveyStructural, computeSynthesis } from '@/lib/analytics/synthesis';

export function useOrgAnalytics(
  timeRange: TimeRange = 30,
  customStart?: string,
  customEnd?: string,
  orgFilter?: OrgFilter,
) {
  const { user } = useAuth();

  const { data, isPending, isFetching } = useQuery({
    queryKey: ['org-analytics', user?.id, timeRange, customStart, customEnd,
      orgFilter?.branchId, orgFilter?.divisionId, orgFilter?.departmentId, orgFilter?.sectionId],
    queryFn: async (): Promise<OrgAnalyticsData> => {
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
        if (filteredIds.length === 0) return emptyResult();
      }

      // ── Parallel core fetches ──
      const [totalActive, entries, surveyResponseRate, { responseDailyMap, responses }] = await Promise.all([
        fetchActiveEmployeeCount(filteredIds),
        fetchMoodEntries(startDate, endDate, filteredIds),
        fetchSurveyResponseRate(startDate, endDate, filteredIds),
        fetchResponseDailyMap(startDate, endDate, filteredIds),
      ]);

      // ── KPIs ──
      const { avgMoodScore, participationRate, riskPercentage } = computeKPIs(entries, totalActive);
      const { avgStreak, employeeEntryMap } = computeStreaks(entries);
      const moodDistribution = computeMoodDistribution(entries);

      const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      const { moodTrend, dailyMap } = computeDailyTrend(entries, allDays, responseDailyMap);
      const dayOfWeekActivity = computeDayOfWeekActivity(entries, responses);
      const riskTrend = computeRiskTrend(entries, allDays);

      // ── Org comparison + top engagers + category analysis (parallel) ──
      const [orgComparison, topEngagers, catAnalysis] = await Promise.all([
        computeOrgComparison(entries, filteredIds),
        computeTopEngagers(entries, filteredIds, startDate, endDate),
        fetchCategoryAnalysis(startDate, endDate, filteredIds),
      ]);

      const { categoryScores, subcategoryScores, affectiveDistribution, catResponses } = catAnalysis;

      // ── Category trends + risk scores ──
      const { categoryTrends, categoryMoodMatrix, moodByCategoryData, catNegMap } =
        await computeCategoryTrendsAndMatrix(categoryScores, catResponses, entries, allDays, startDate, endDate, filteredIds);

      const categoryRiskScores = computeCategoryRiskScores(categoryScores, categoryScores.map(c => categoryTrends.get(c.id) ?? []), catNegMap);
      const compositeHealthScore = computeHealthScore(avgMoodScore, participationRate, riskPercentage);
      const earlyWarnings = detectEarlyWarnings(categoryRiskScores, categoryTrends, participationRate, riskTrend);

      // ── Period comparison ──
      const periodComparison = await fetchPreviousPeriodComparison(
        rangeStart, rangeEnd, filteredIds,
        { avgMood: avgMoodScore, participation: participationRate, risk: riskPercentage },
        totalActive,
      );

      // ── Check-in deep analysis ──
      const checkinMoodOverTime = computeCheckinMoodOverTime(entries, allDays);
      const supportActionCounts = computeSupportActions(entries);
      const streakDistribution = computeStreakDistribution(employeeEntryMap);
      const checkinByOrgUnit = computeCheckinByOrgUnit(orgComparison);

      // ── Three-Layer Intelligence ──
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

      return {
        activeEmployees: totalActive, avgMoodScore, participationRate, surveyResponseRate,
        riskPercentage, avgStreak, moodTrend, moodDistribution, categoryScores,
        subcategoryScores, affectiveDistribution, dayOfWeekActivity,
        riskTrend, orgComparison, topEngagers,
        categoryRiskScores, categoryTrends, categoryMoodMatrix,
        earlyWarnings, periodComparison, compositeHealthScore, moodByCategoryData,
        checkinMoodOverTime, supportActionCounts, streakDistribution, checkinByOrgUnit,
        checkinPulse, surveyStructural, synthesisData, trendOverlayData,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { data, isPending: isPending && isFetching };
}
