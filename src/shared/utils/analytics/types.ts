// ── Consolidated Analytics Types ──────────────────────────────
// Single source of truth for all analytics-related interfaces.
// ZERO imports from hooks or components.

// ── Time & Filter ──

export type TimeRange = 7 | 30 | 90 | 'custom';

export interface OrgFilter {
  branchId?: string;
  divisionId?: string;
  departmentId?: string;
  sectionId?: string;
}

// ── Category / Subcategory ──

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

// ── Affective ──

export interface AffectiveDistribution {
  state: 'positive' | 'neutral' | 'negative';
  count: number;
  percentage: number;
}

// ── Activity / Trend ──

export interface DayOfWeekActivity {
  day: number;
  count: number;
}

export interface RiskTrendPoint {
  date: string;
  riskPct: number;
  totalEntries: number;
}

// ── Org Comparison ──

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

// ── Top Engagers ──

export interface TopEngager {
  employeeId: string;
  firstName: string;
  department: string;
  departmentAr?: string | null;
  streak: number;
  responseCount: number;
  totalPoints: number;
}

// ── Check-in Analytics ──

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

// ── Trend Overlay (moved from TrendOverlayChart component) ──

export interface TrendOverlayPoint {
  date: string;
  checkinAvg: number;
  surveyAvg: number;
}

// ── Risk Scoring (from wellnessAnalytics) ──

export interface CategoryRiskScore {
  id: string;
  name: string;
  nameAr: string | null;
  color: string;
  avgScore: number;
  responseCount: number;
  riskScore: number;
  trend: 'improving' | 'stable' | 'watch' | 'critical';
  declineRate: number;
  negativeRatio: number;
}

export interface CategoryTrendPoint {
  date: string;
  avgScore: number;
  count: number;
}

export interface CategoryMoodCell {
  categoryId: string;
  categoryName: string;
  categoryNameAr: string | null;
  moodLevel: string;
  count: number;
  avgScore: number;
}

export interface EarlyWarning {
  id: string;
  type: 'declining_trend' | 'spike_detected' | 'low_engagement' | 'recurring_risk';
  severity: 'high' | 'medium' | 'low';
  area: string;
  areaAr?: string | null;
  message: string;
  messageAr?: string;
  value: number;
  trendData?: CategoryTrendPoint[];
}

export interface PeriodComparison {
  moodDelta: number;
  participationDelta: number;
  riskDelta: number;
  direction: 'improving' | 'declining' | 'stable';
}

// ── Synthesis Engine (from synthesisEngine) ──

export interface CheckinPulseMetrics {
  volatilityIndex: number;
  participationStability: number;
  energyTrend: 'up' | 'down' | 'stable';
  topEmotionCluster: string;
}

export interface SurveyStructuralMetrics {
  categoryHealthScore: number;
  lowestCategory: { name: string; score: number } | null;
  participationQuality: number;
  riskCategoryCount: number;
}

export interface DivergenceAlert {
  pattern: string;
  patternKey: string;
  descriptionKey: string;
  confidence: number;
  interventionKey: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DepartmentBAIItem {
  id: string;
  name: string;
  nameAr?: string | null;
  baiScore: number;
  checkinAvg: number;
  surveyAvg: number;
  employeeCount: number;
  classification: 'green' | 'yellow' | 'orange' | 'red';
}

export interface SynthesisResult {
  baiScore: number;
  divergenceLevel: 'high_alignment' | 'moderate' | 'significant';
  riskClassification: 'green' | 'yellow' | 'orange' | 'red';
  confidenceScore: number;
  recommendedActionKey: string;
  alerts: DivergenceAlert[];
  branchBAI: DepartmentBAIItem[];
  divisionBAI: DepartmentBAIItem[];
  departmentBAI: DepartmentBAIItem[];
  sectionBAI: DepartmentBAIItem[];
}

// ── Main aggregate shape ──

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
