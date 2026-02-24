// ── Shared Analytics Types ──────────────────────────────────
// Extracted from useOrgAnalytics to be reusable across domain hooks.

import type { CategoryRiskScore, CategoryTrendPoint, CategoryMoodCell, EarlyWarning, PeriodComparison } from './wellnessAnalytics';
import type { CheckinPulseMetrics, SurveyStructuralMetrics, SynthesisResult } from './synthesisEngine';
import type { TrendOverlayPoint } from '@/components/dashboard/comparison/TrendOverlayChart';

export type TimeRange = 7 | 30 | 90 | 'custom';

export interface OrgFilter {
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
}

export interface CategoryScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  avgScore: number;
  responseCount: number;
}

export interface SubcategoryScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  categoryName: string;
  categoryNameAr: string | null;
  avgScore: number;
  responseCount: number;
}

export interface AffectiveDistribution {
  state: 'positive' | 'neutral' | 'negative';
  count: number;
  percentage: number;
}

export interface DayOfWeekActivity {
  day: number;
  count: number;
}

export interface RiskTrendPoint {
  date: string;
  riskPct: number;
  totalEntries: number;
}

export interface OrgUnitComparison {
  id: string;
  name: string;
  nameAr?: string | null;
  avgScore: number;
  participation: number;
  riskPct: number;
  employeeCount: number;
}

export interface OrgComparison {
  branches: OrgUnitComparison[];
  divisions: OrgUnitComparison[];
  departments: OrgUnitComparison[];
  sections: OrgUnitComparison[];
}

export interface TopEngager {
  employeeId: string;
  firstName: string;
  department: string;
  departmentAr?: string | null;
  streak: number;
  responseCount: number;
  totalPoints: number;
}

export interface CheckinMoodOverTimePoint {
  date: string;
  label: string;
  great: number;
  good: number;
  okay: number;
  struggling: number;
  need_help: number;
}

export interface SupportActionCount {
  action: string;
  count: number;
}

export interface StreakBucket {
  bucket: string;
  count: number;
}

export interface CheckinByOrgUnitItem {
  id: string;
  name: string;
  nameAr?: string | null;
  avgScore: number;
  entryCount: number;
}

export interface MoodEntry {
  mood_score: number;
  mood_level: string;
  entry_date: string;
  employee_id: string;
  support_actions: any;
  streak_count: number;
  created_at: string;
}

export interface OrgAnalyticsData {
  activeEmployees: number;
  avgMoodScore: number;
  participationRate: number;
  surveyResponseRate: number;
  riskPercentage: number;
  avgStreak: number;
  moodTrend: { date: string; avg: number; count: number; responseCount: number }[];
  moodDistribution: { level: string; count: number; percentage: number }[];
  categoryScores: CategoryScore[];
  subcategoryScores: SubcategoryScore[];
  affectiveDistribution: AffectiveDistribution[];
  dayOfWeekActivity: DayOfWeekActivity[];
  riskTrend: RiskTrendPoint[];
  orgComparison: OrgComparison;
  topEngagers: TopEngager[];
  categoryRiskScores: CategoryRiskScore[];
  categoryTrends: Map<string, CategoryTrendPoint[]>;
  categoryMoodMatrix: CategoryMoodCell[];
  earlyWarnings: EarlyWarning[];
  periodComparison: PeriodComparison | null;
  compositeHealthScore: number;
  moodByCategoryData: Map<string, { date: string; label: string; great: number; good: number; okay: number; struggling: number; need_help: number }[]>;
  checkinMoodOverTime: CheckinMoodOverTimePoint[];
  supportActionCounts: SupportActionCount[];
  streakDistribution: StreakBucket[];
  checkinByOrgUnit: CheckinByOrgUnitItem[];
  checkinPulse: CheckinPulseMetrics;
  surveyStructural: SurveyStructuralMetrics;
  synthesisData: SynthesisResult;
  trendOverlayData: TrendOverlayPoint[];
}

export function emptyResult(): OrgAnalyticsData {
  return {
    activeEmployees: 0, avgMoodScore: 0, participationRate: 0, surveyResponseRate: 0,
    riskPercentage: 0, avgStreak: 0, moodTrend: [], moodDistribution: [],
    categoryScores: [], subcategoryScores: [], affectiveDistribution: [], dayOfWeekActivity: [],
    riskTrend: [], orgComparison: { branches: [], divisions: [], departments: [], sections: [] }, topEngagers: [],
    categoryRiskScores: [], categoryTrends: new Map(), categoryMoodMatrix: [],
    earlyWarnings: [], periodComparison: null, compositeHealthScore: 0, moodByCategoryData: new Map(),
    checkinMoodOverTime: [], supportActionCounts: [], streakDistribution: [], checkinByOrgUnit: [],
    checkinPulse: { volatilityIndex: 0, participationStability: 0, energyTrend: 'stable', topEmotionCluster: 'okay' },
    surveyStructural: { categoryHealthScore: 0, lowestCategory: null, participationQuality: 0, riskCategoryCount: 0 },
    synthesisData: { baiScore: 0, divergenceLevel: 'high_alignment', riskClassification: 'green', confidenceScore: 0, recommendedActionKey: 'synthesis.actions.maintain', alerts: [], branchBAI: [], divisionBAI: [], departmentBAI: [], sectionBAI: [] },
    trendOverlayData: [],
  };
}
