// ── Risk scoring, early warnings, health, period comparison ──
// Pure functions, no Supabase, no React.

import type {
  CategoryScore, CategoryRiskScore, CategoryTrendPoint,
  EarlyWarning, RiskTrendPoint, PeriodComparison,
} from '../types';

// ── Risk Scoring ──

export function computeRiskScore(avgScore: number, declineRate: number, negativeRatio: number): number {
  return Math.min(100, Math.max(0,
    (5 - avgScore) * 20 + declineRate * 10 + (negativeRatio > 0.3 ? 10 : 0)
  ));
}

export function riskStatus(score: number): 'critical' | 'watch' | 'stable' | 'improving' {
  if (score >= 60) return 'critical';
  if (score >= 40) return 'watch';
  if (score >= 20) return 'stable';
  return 'improving';
}

function computeDeclineRate(trend: CategoryTrendPoint[]): number {
  const valid = trend.filter(t => t.count > 0);
  if (valid.length < 3) return 0;
  const firstHalf = valid.slice(0, Math.floor(valid.length / 2));
  const secondHalf = valid.slice(Math.floor(valid.length / 2));
  const avgFirst = firstHalf.reduce((s, t) => s + t.avgScore, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, t) => s + t.avgScore, 0) / secondHalf.length;
  return Math.max(0, avgFirst - avgSecond);
}

export function computeCategoryRiskScores(
  categories: CategoryScore[],
  categoryTrends: CategoryTrendPoint[][],
  categoryResponses: Map<string, { negativeCount: number; totalCount: number }>
): CategoryRiskScore[] {
  return categories.map((cat, idx) => {
    const trend = categoryTrends[idx] ?? [];
    const declineRate = computeDeclineRate(trend);
    const respData = categoryResponses.get(cat.id);
    const negativeRatio = respData && respData.totalCount > 0 ? respData.negativeCount / respData.totalCount : 0;
    const score = computeRiskScore(cat.avgScore, declineRate, negativeRatio);
    return {
      id: cat.id, name: cat.name, nameAr: cat.nameAr, color: cat.color,
      avgScore: cat.avgScore, responseCount: cat.responseCount,
      riskScore: Math.round(score), trend: riskStatus(score), declineRate, negativeRatio,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

// ── Early Warning Detection ──

export function detectEarlyWarnings(
  categoryRisks: CategoryRiskScore[],
  categoryTrends: Map<string, CategoryTrendPoint[]>,
  participationRate: number,
  riskTrend: RiskTrendPoint[],
): EarlyWarning[] {
  const warnings: EarlyWarning[] = [];

  // 1. Consecutive decline detection per category
  categoryRisks.forEach(cat => {
    const trend = categoryTrends.get(cat.id) ?? [];
    const valid = trend.filter(t => t.count > 0);
    if (valid.length >= 3) {
      let consecutiveDeclines = 0;
      for (let i = 1; i < valid.length; i++) {
        if (valid[i].avgScore < valid[i - 1].avgScore) consecutiveDeclines++;
        else consecutiveDeclines = 0;
        if (consecutiveDeclines >= 3) {
          warnings.push({
            id: `decline_${cat.id}`,
            type: 'declining_trend',
            severity: 'high',
            area: cat.name,
            areaAr: cat.nameAr,
            message: `${cat.name} has been declining for ${consecutiveDeclines + 1} consecutive periods`,
            value: cat.declineRate,
            trendData: valid.slice(-7),
          });
          break;
        }
      }
    }
  });

  // 2. Spike detection in risk trend
  const recentRisk = riskTrend.filter(r => r.totalEntries > 0);
  if (recentRisk.length >= 5) {
    const values = recentRisk.map(r => r.riskPct);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    const latest = values[values.length - 1];
    if (latest > mean + 2 * stdDev && stdDev > 0) {
      warnings.push({
        id: 'spike_risk',
        type: 'spike_detected',
        severity: 'high',
        area: 'Overall Risk',
        message: `Risk spike detected: ${latest}% vs average ${Math.round(mean)}%`,
        value: latest,
      });
    }
  }

  // 3. Low engagement
  if (participationRate < 30 && participationRate > 0) {
    warnings.push({
      id: 'low_engagement',
      type: 'low_engagement',
      severity: 'medium',
      area: 'Organization',
      message: `Participation rate is ${participationRate}%, below the 30% threshold`,
      value: participationRate,
    });
  }

  // 4. Recurring critical categories
  categoryRisks.filter(c => c.trend === 'critical').forEach(cat => {
    warnings.push({
      id: `recurring_${cat.id}`,
      type: 'recurring_risk',
      severity: 'high',
      area: cat.name,
      areaAr: cat.nameAr,
      message: `${cat.name} is in critical status (risk score: ${cat.riskScore})`,
      value: cat.riskScore,
    });
  });

  return warnings.sort((a, b) => {
    const sev = { high: 3, medium: 2, low: 1 };
    return sev[b.severity] - sev[a.severity];
  });
}

// ── Composite Health Score ──

export function computeHealthScore(avgMood: number, participationRate: number, riskPercentage: number): number {
  const moodComponent = (avgMood / 5) * 40;
  const partComponent = (participationRate / 100) * 30;
  const riskComponent = ((100 - riskPercentage) / 100) * 30;
  return Math.round(Math.max(0, Math.min(100, moodComponent + partComponent + riskComponent)));
}

// ── Period Comparison ──

export function computePeriodComparison(
  current: { avgMood: number; participation: number; risk: number },
  previous: { avgMood: number; participation: number; risk: number },
): PeriodComparison {
  const moodDelta = Math.round((current.avgMood - previous.avgMood) * 10) / 10;
  const participationDelta = current.participation - previous.participation;
  const riskDelta = current.risk - previous.risk;
  const score = moodDelta * 2 + participationDelta * 0.1 - riskDelta * 0.1;
  return {
    moodDelta, participationDelta, riskDelta,
    direction: score > 0.2 ? 'improving' : score < -0.2 ? 'declining' : 'stable',
  };
}
