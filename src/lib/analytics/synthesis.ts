// ── Synthesis Engine ──
// Three-Layer Intelligence: Check-in Pulse → Survey Structural → BAI Synthesis.
// Pure functions, no Supabase, no React.

import type {
  CheckinPulseMetrics, SurveyStructuralMetrics,
  DivergenceAlert, DepartmentBAIItem, SynthesisResult,
} from './types';

// ── Helpers ──

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const sqDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / values.length);
}

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  return stddev(values) / mean;
}

function normalize1to5(score: number): number {
  return Math.max(0, Math.min(1, (score - 1) / 4));
}

function classifyBAI(bai: number): 'green' | 'yellow' | 'orange' | 'red' {
  if (bai > 0.75) return 'green';
  if (bai > 0.5) return 'yellow';
  if (bai > 0.3) return 'orange';
  return 'red';
}

function divergenceLevel(bai: number): 'high_alignment' | 'moderate' | 'significant' {
  if (bai > 0.75) return 'high_alignment';
  if (bai > 0.5) return 'moderate';
  return 'significant';
}

// ── Layer 1: Check-In Pulse ──

export function computeCheckinPulse(
  entries: { mood_score: number; mood_level: string; entry_date: string }[],
): CheckinPulseMetrics {
  const dailyMap: Record<string, { total: number; count: number }> = {};
  entries.forEach(e => {
    if (!dailyMap[e.entry_date]) dailyMap[e.entry_date] = { total: 0, count: 0 };
    dailyMap[e.entry_date].total += e.mood_score;
    dailyMap[e.entry_date].count += 1;
  });

  const sortedDates = Object.keys(dailyMap).sort().slice(-14);
  const dailyAvgs = sortedDates.map(d => dailyMap[d].total / dailyMap[d].count);
  const volatilityIndex = Math.round(stddev(dailyAvgs) * 100) / 100;

  const dailyCounts = sortedDates.map(d => dailyMap[d].count);
  const participationStability = Math.round(coefficientOfVariation(dailyCounts) * 100) / 100;

  const last7 = dailyAvgs.slice(-7);
  const prev7 = dailyAvgs.slice(-14, -7);
  const avgLast7 = last7.length > 0 ? last7.reduce((s, v) => s + v, 0) / last7.length : 0;
  const avgPrev7 = prev7.length > 0 ? prev7.reduce((s, v) => s + v, 0) / prev7.length : 0;
  const diff = avgLast7 - avgPrev7;
  const energyTrend: 'up' | 'down' | 'stable' = diff > 0.15 ? 'up' : diff < -0.15 ? 'down' : 'stable';

  const levelCounts: Record<string, number> = {};
  entries.forEach(e => { levelCounts[e.mood_level] = (levelCounts[e.mood_level] ?? 0) + 1; });
  const topEmotionCluster = Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'okay';

  return { volatilityIndex, participationStability, energyTrend, topEmotionCluster };
}

// ── Layer 2: Survey Structural ──

export function computeSurveyStructural(
  categoryScores: { id: string; name: string; avgScore: number; responseCount: number }[],
  categoryRiskScores: { name: string; trend: string }[],
  surveyResponseRate: number,
): SurveyStructuralMetrics {
  const totalResponses = categoryScores.reduce((s, c) => s + c.responseCount, 0);
  const categoryHealthScore = totalResponses > 0
    ? Math.round((categoryScores.reduce((s, c) => s + c.avgScore * c.responseCount, 0) / totalResponses) * 10) / 10
    : 0;

  const sorted = [...categoryScores].sort((a, b) => a.avgScore - b.avgScore);
  const lowestCategory = sorted.length > 0 ? { name: sorted[0].name, score: sorted[0].avgScore } : null;

  const riskCategoryCount = categoryRiskScores.filter(c => c.trend === 'critical' || c.trend === 'watch').length;

  return { categoryHealthScore, lowestCategory, participationQuality: surveyResponseRate, riskCategoryCount };
}

// ── Layer 3: Synthesis ──

export function computeBAI(checkinAvg: number, surveyAvg: number): number {
  const checkinNorm = normalize1to5(checkinAvg);
  const surveyNorm = normalize1to5(surveyAvg);
  return Math.round((1 - Math.abs(checkinNorm - surveyNorm)) * 100) / 100;
}

export function computeConfidence(
  checkinParticipation: number,
  surveyResponseRate: number,
  totalEntries: number,
  totalResponses: number,
): number {
  const factors = [
    Math.min(checkinParticipation / 60, 1) * 0.3,
    Math.min(surveyResponseRate / 60, 1) * 0.3,
    Math.min(totalEntries / 30, 1) * 0.2,
    Math.min(totalResponses / 20, 1) * 0.2,
  ];
  return Math.round(factors.reduce((s, v) => s + v, 0) * 100);
}

export function detectDivergencePatterns(
  volatility: number,
  checkinAvg: number,
  surveyAvg: number,
  checkinParticipation: number,
  surveyResponseRate: number,
  lowestCatScore: number | null,
  sampleSize: number,
): DivergenceAlert[] {
  const alerts: DivergenceAlert[] = [];

  if (sampleSize < 5 || checkinParticipation < 60) return alerts;

  if (volatility > 1.0 && lowestCatScore !== null && lowestCatScore < 2.5) {
    alerts.push({
      pattern: 'Sentiment-Structure Misalignment',
      patternKey: 'synthesis.alerts.misalignment',
      descriptionKey: 'synthesis.alerts.misalignmentDesc',
      confidence: Math.min(85, Math.round(volatility * 40 + (2.5 - lowestCatScore) * 20)),
      interventionKey: 'synthesis.alerts.misalignmentAction',
      severity: 'high',
    });
  }

  if (checkinParticipation < 60 && surveyResponseRate > 50) {
    alerts.push({
      pattern: 'Participation Fatigue',
      patternKey: 'synthesis.alerts.fatigue',
      descriptionKey: 'synthesis.alerts.fatigueDesc',
      confidence: Math.round(70 + (surveyResponseRate - checkinParticipation) * 0.5),
      interventionKey: 'synthesis.alerts.fatigueAction',
      severity: 'medium',
    });
  }

  if (checkinAvg > 3.5 && surveyAvg > 0 && surveyAvg < 2.5) {
    alerts.push({
      pattern: 'Surface Positivity Risk',
      patternKey: 'synthesis.alerts.surfacePositivity',
      descriptionKey: 'synthesis.alerts.surfacePositivityDesc',
      confidence: Math.min(90, Math.round((checkinAvg - surveyAvg) * 30)),
      interventionKey: 'synthesis.alerts.surfacePositivityAction',
      severity: 'high',
    });
  }

  return alerts;
}

export function getRecommendedActionKey(
  divLevel: 'high_alignment' | 'moderate' | 'significant',
  alerts: DivergenceAlert[],
): string {
  if (alerts.length > 0) return `synthesis.actions.${alerts[0].patternKey.split('.').pop()}`;
  switch (divLevel) {
    case 'high_alignment': return 'synthesis.actions.maintain';
    case 'moderate': return 'synthesis.actions.monitor';
    case 'significant': return 'synthesis.actions.investigate';
  }
}

export function computeSynthesis(
  checkinPulse: CheckinPulseMetrics,
  surveyStructural: SurveyStructuralMetrics,
  checkinAvg: number,
  checkinParticipation: number,
  surveyResponseRate: number,
  totalEntries: number,
  totalResponses: number,
  orgUnitData: {
    branches: { id: string; name: string; nameAr?: string | null; checkinAvg: number; surveyAvg: number; employeeCount: number }[];
    divisions: { id: string; name: string; nameAr?: string | null; checkinAvg: number; surveyAvg: number; employeeCount: number }[];
    departments: { id: string; name: string; nameAr?: string | null; checkinAvg: number; surveyAvg: number; employeeCount: number }[];
    sections: { id: string; name: string; nameAr?: string | null; checkinAvg: number; surveyAvg: number; employeeCount: number }[];
  },
): SynthesisResult {
  const surveyAvg = surveyStructural.categoryHealthScore;
  const baiScore = computeBAI(checkinAvg, surveyAvg);
  const divLevel = divergenceLevel(baiScore);
  const riskClass = classifyBAI(baiScore);
  const confidenceScore = computeConfidence(checkinParticipation, surveyResponseRate, totalEntries, totalResponses);

  const alerts = detectDivergencePatterns(
    checkinPulse.volatilityIndex,
    checkinAvg,
    surveyAvg,
    checkinParticipation,
    surveyResponseRate,
    surveyStructural.lowestCategory?.score ?? null,
    totalEntries,
  );

  const recommendedActionKey = getRecommendedActionKey(divLevel, alerts);

  function computeUnitBAI(units: { id: string; name: string; nameAr?: string | null; checkinAvg: number; surveyAvg: number; employeeCount: number }[]): DepartmentBAIItem[] {
    return units
      .filter(d => d.employeeCount >= 5)
      .map(d => {
        const unitBAI = computeBAI(d.checkinAvg, d.surveyAvg);
        return { ...d, baiScore: unitBAI, classification: classifyBAI(unitBAI) };
      });
  }

  return {
    baiScore,
    divergenceLevel: divLevel,
    riskClassification: riskClass,
    confidenceScore,
    recommendedActionKey,
    alerts,
    branchBAI: computeUnitBAI(orgUnitData.branches),
    divisionBAI: computeUnitBAI(orgUnitData.divisions),
    departmentBAI: computeUnitBAI(orgUnitData.departments),
    sectionBAI: computeUnitBAI(orgUnitData.sections),
  };
}
