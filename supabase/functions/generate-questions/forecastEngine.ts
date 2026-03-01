/**
 * Predictive Cost & Performance Engine — PR-AI-INT-04
 *
 * Provides:
 * - Rolling 7-day burn rate & monthly cost projection
 * - Exponential smoothing for cost forecasting
 * - SLA trend detection (latency drift, error rate trends)
 * - Auto-adaptive routing weight adjustment hooks
 * - Forecast state persistence
 *
 * Safety: All functions are fail-open. Forecast failures never block routing.
 * No PII or prompt content is logged.
 */

import { clamp01 } from "./hybridRouter.ts";
import type { CostAwareWeights } from "./costAwareRouter.ts";

// ── Types ───────────────────────────────────────────────────────

export type SlaRiskLevel = 'low' | 'medium' | 'high';

export interface DailyCostRow {
  date: string;
  tenant_id: string;
  feature: string;
  provider: string;
  total_cost: number;
  total_calls: number;
  avg_cost_per_call: number;
}

export interface DailyPerformanceRow {
  date: string;
  provider: string;
  feature: string;
  avg_latency: number;
  error_rate: number;
  success_rate: number;
  total_calls: number;
}

export interface ForecastState {
  tenant_id: string;
  feature: string;
  projected_monthly_cost: number;
  burn_rate: number;
  sla_risk_level: SlaRiskLevel;
  performance_drift_score: number;
  last_updated: string;
}

export interface ForecastResult {
  burnRate: number;
  projectedMonthlyCost: number;
  smoothedDailyCost: number;
  budgetRisk: SlaRiskLevel;
}

export interface SlaTrendResult {
  latencyDrift: number;
  errorRateTrend: number;
  slaRiskLevel: SlaRiskLevel;
  performanceDriftScore: number;
}

export interface ForecastAdjustments {
  costWeightMultiplier: number;
  providerPenalty: number;
  explorationBoost: boolean;
  tsAlphaDecay: number;
  tsBetaDecay: number;
}

export interface AggregationParams {
  /** The date to aggregate (YYYY-MM-DD format) */
  targetDate: string;
}

// ── Constants ───────────────────────────────────────────────────

const BURN_RATE_WINDOW_DAYS = 7;
const EXP_SMOOTHING_ALPHA = 0.3;
const BUDGET_HIGH_THRESHOLD = 0.9;
const BUDGET_MEDIUM_THRESHOLD = 0.7;
const LATENCY_DRIFT_HIGH = 0.30;
const LATENCY_DRIFT_MEDIUM = 0.15;
const ERROR_RATE_TREND_THRESHOLD = 0.10;
const COST_WEIGHT_BOOST_FACTOR = 1.25;
const SLA_PENALTY_FACTOR = 0.8;
const TS_EXPLORATION_DECAY = 0.95;

// ── Cost Forecast Functions ─────────────────────────────────────

/**
 * Compute rolling 7-day burn rate and project monthly cost.
 */
export function computeBurnRate(dailyCosts: number[]): { burnRate: number; projectedMonthlyCost: number } {
  if (dailyCosts.length === 0) {
    return { burnRate: 0, projectedMonthlyCost: 0 };
  }

  const window = dailyCosts.slice(-BURN_RATE_WINDOW_DAYS);
  const totalInWindow = window.reduce((s, c) => s + c, 0);
  const burnRate = totalInWindow / Math.max(window.length, 1);
  const projectedMonthlyCost = burnRate * 30;

  return { burnRate, projectedMonthlyCost };
}

/**
 * Exponential smoothing for daily cost series.
 * smoothed_t = alpha * actual_t + (1 - alpha) * smoothed_(t-1)
 */
export function exponentialSmoothing(
  dailyCosts: number[],
  alpha: number = EXP_SMOOTHING_ALPHA,
): number {
  if (dailyCosts.length === 0) return 0;
  if (dailyCosts.length === 1) return dailyCosts[0];

  let smoothed = dailyCosts[0];
  for (let i = 1; i < dailyCosts.length; i++) {
    smoothed = alpha * dailyCosts[i] + (1 - alpha) * smoothed;
  }
  return smoothed;
}

/**
 * Determine budget risk level based on projected vs actual budget.
 */
export function computeBudgetRisk(
  projectedMonthlyCost: number,
  monthlyBudget: number,
): SlaRiskLevel {
  if (monthlyBudget <= 0) return 'low';
  const ratio = projectedMonthlyCost / monthlyBudget;
  if (ratio > BUDGET_HIGH_THRESHOLD) return 'high';
  if (ratio > BUDGET_MEDIUM_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Full cost forecast pipeline.
 */
export function computeCostForecast(
  dailyCosts: number[],
  monthlyBudget: number,
): ForecastResult {
  const { burnRate, projectedMonthlyCost } = computeBurnRate(dailyCosts);
  const smoothedDailyCost = exponentialSmoothing(dailyCosts);
  const budgetRisk = computeBudgetRisk(projectedMonthlyCost, monthlyBudget);

  return {
    burnRate,
    projectedMonthlyCost,
    smoothedDailyCost,
    budgetRisk,
  };
}

// ── SLA Trend Detection ─────────────────────────────────────────

/**
 * Compute latency drift between two periods.
 * drift = (current - previous) / previous
 */
export function computeLatencyDrift(
  currentPeriodLatencies: number[],
  previousPeriodLatencies: number[],
): number {
  if (previousPeriodLatencies.length === 0 || currentPeriodLatencies.length === 0) return 0;

  const currentMean = currentPeriodLatencies.reduce((s, v) => s + v, 0) / currentPeriodLatencies.length;
  const previousMean = previousPeriodLatencies.reduce((s, v) => s + v, 0) / previousPeriodLatencies.length;

  if (previousMean <= 0) return 0;
  return (currentMean - previousMean) / previousMean;
}

/**
 * Compute error rate trend between two periods.
 */
export function computeErrorRateTrend(
  currentErrorRate: number,
  previousErrorRate: number,
): number {
  return currentErrorRate - previousErrorRate;
}

/**
 * Determine SLA risk level from drift metrics.
 */
export function computeSlaRiskLevel(
  latencyDrift: number,
  errorRateTrend: number,
): SlaRiskLevel {
  if (latencyDrift > LATENCY_DRIFT_HIGH || errorRateTrend > ERROR_RATE_TREND_THRESHOLD) return 'high';
  if (latencyDrift > LATENCY_DRIFT_MEDIUM || errorRateTrend > ERROR_RATE_TREND_THRESHOLD / 2) return 'medium';
  return 'low';
}

/**
 * Composite performance drift score (0-1 scale, higher = worse).
 */
export function computePerformanceDriftScore(
  latencyDrift: number,
  errorRateTrend: number,
): number {
  // Normalize both to 0-1 and combine
  const normalizedLatencyDrift = clamp01(Math.abs(latencyDrift) / 0.5); // 50% drift = 1.0
  const normalizedErrorTrend = clamp01(Math.abs(errorRateTrend) / 0.2); // 20% error increase = 1.0
  return clamp01(0.6 * normalizedLatencyDrift + 0.4 * normalizedErrorTrend);
}

/**
 * Full SLA trend analysis pipeline.
 */
export function computeSlaTrend(
  currentLatencies: number[],
  previousLatencies: number[],
  currentErrorRate: number,
  previousErrorRate: number,
): SlaTrendResult {
  const latencyDrift = computeLatencyDrift(currentLatencies, previousLatencies);
  const errorRateTrend = computeErrorRateTrend(currentErrorRate, previousErrorRate);
  const slaRiskLevel = computeSlaRiskLevel(latencyDrift, errorRateTrend);
  const performanceDriftScore = computePerformanceDriftScore(latencyDrift, errorRateTrend);

  return { latencyDrift, errorRateTrend, slaRiskLevel, performanceDriftScore };
}

// ── Auto-Adaptive Routing Adjustments ───────────────────────────

/**
 * Compute routing adjustments based on forecast state.
 * These adjustments are applied on top of existing INT-02/INT-03 logic.
 */
export function computeForecastAdjustments(
  budgetRisk: SlaRiskLevel,
  slaRiskLevel: SlaRiskLevel,
  performanceDriftScore: number,
): ForecastAdjustments {
  let costWeightMultiplier = 1.0;
  let providerPenalty = 1.0;
  let explorationBoost = false;
  let tsAlphaDecay = 1.0;
  let tsBetaDecay = 1.0;

  // Budget risk → gradually increase cost weight
  if (budgetRisk === 'high') {
    costWeightMultiplier = COST_WEIGHT_BOOST_FACTOR;
  } else if (budgetRisk === 'medium') {
    costWeightMultiplier = 1.0 + (COST_WEIGHT_BOOST_FACTOR - 1.0) * 0.5; // half boost
  }

  // SLA risk → reduce quality weight for degraded providers
  if (slaRiskLevel === 'high') {
    providerPenalty = SLA_PENALTY_FACTOR;
  } else if (slaRiskLevel === 'medium') {
    providerPenalty = 1.0 - (1.0 - SLA_PENALTY_FACTOR) * 0.5; // half penalty
  }

  // Performance drift → boost exploration via Thompson prior decay
  if (performanceDriftScore > 0.5) {
    explorationBoost = true;
    tsAlphaDecay = TS_EXPLORATION_DECAY;
    tsBetaDecay = TS_EXPLORATION_DECAY;
  }

  return {
    costWeightMultiplier,
    providerPenalty,
    explorationBoost,
    tsAlphaDecay,
    tsBetaDecay,
  };
}

/**
 * Apply forecast-based cost weight adjustment to existing weights.
 * Renormalizes weights after adjustment.
 */
export function applyForecastCostAdjustment(
  weights: CostAwareWeights,
  costWeightMultiplier: number,
): CostAwareWeights {
  if (costWeightMultiplier === 1.0) return { ...weights };

  const adjusted = { ...weights };
  adjusted.w_cost *= costWeightMultiplier;

  // Renormalize
  const sum = adjusted.w_quality + adjusted.w_latency + adjusted.w_stability + adjusted.w_cost + adjusted.w_confidence;
  if (sum > 0) {
    adjusted.w_quality /= sum;
    adjusted.w_latency /= sum;
    adjusted.w_stability /= sum;
    adjusted.w_cost /= sum;
    adjusted.w_confidence /= sum;
  }

  return adjusted;
}

// ── Daily Aggregation Functions ─────────────────────────────────

/**
 * Aggregate yesterday's AI provider events into daily cost rows.
 * Idempotent: uses upsert on PK.
 */
export async function aggregateDailyCosts(
  supabase: any,
  targetDate: string,
): Promise<{ aggregated: number; errors: string[] }> {
  const errors: string[] = [];
  let aggregated = 0;

  try {
    // Query raw events for the target date
    const startOfDay = `${targetDate}T00:00:00Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    const { data: events, error } = await supabase
      .from('ai_provider_events')
      .select('tenant_id, feature, provider, estimated_cost')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (error) {
      errors.push(`Failed to query events: ${error.message}`);
      return { aggregated, errors };
    }

    if (!events || events.length === 0) {
      return { aggregated: 0, errors };
    }

    // Group by (tenant_id, feature, provider)
    const groups = new Map<string, { totalCost: number; totalCalls: number }>();
    for (const e of events) {
      const key = `${e.tenant_id || 'global'}::${e.feature}::${e.provider}`;
      const existing = groups.get(key) || { totalCost: 0, totalCalls: 0 };
      existing.totalCost += e.estimated_cost || 0;
      existing.totalCalls += 1;
      groups.set(key, existing);
    }

    // Upsert aggregations
    for (const [key, value] of groups) {
      const [tenantId, feature, provider] = key.split('::');
      if (tenantId === 'global' || !tenantId) continue; // skip events without tenant_id

      const avgCost = value.totalCalls > 0 ? value.totalCost / value.totalCalls : 0;

      const { error: upsertErr } = await supabase
        .from('ai_cost_daily_agg')
        .upsert(
          {
            date: targetDate,
            tenant_id: tenantId,
            feature,
            provider,
            total_cost: value.totalCost,
            total_calls: value.totalCalls,
            avg_cost_per_call: avgCost,
          },
          { onConflict: 'date,tenant_id,feature,provider' },
        );

      if (upsertErr) {
        errors.push(`Upsert failed for ${key}: ${upsertErr.message}`);
      } else {
        aggregated++;
      }
    }
  } catch (err) {
    errors.push(`Unexpected error: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  return { aggregated, errors };
}

/**
 * Aggregate yesterday's performance metrics into daily rows.
 * Idempotent: uses upsert on PK.
 */
export async function aggregateDailyPerformance(
  supabase: any,
  targetDate: string,
): Promise<{ aggregated: number; errors: string[] }> {
  const errors: string[] = [];
  let aggregated = 0;

  try {
    const startOfDay = `${targetDate}T00:00:00Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    const { data: events, error } = await supabase
      .from('ai_provider_events')
      .select('provider, feature, latency_ms, success')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (error) {
      errors.push(`Failed to query events: ${error.message}`);
      return { aggregated, errors };
    }

    if (!events || events.length === 0) {
      return { aggregated: 0, errors };
    }

    // Group by (provider, feature)
    const groups = new Map<string, { latencies: number[]; successes: number; total: number }>();
    for (const e of events) {
      const key = `${e.provider}::${e.feature}`;
      const existing = groups.get(key) || { latencies: [], successes: 0, total: 0 };
      existing.latencies.push(e.latency_ms || 0);
      if (e.success) existing.successes++;
      existing.total++;
      groups.set(key, existing);
    }

    for (const [key, value] of groups) {
      const [provider, feature] = key.split('::');
      const avgLatency = value.latencies.reduce((s, v) => s + v, 0) / Math.max(value.latencies.length, 1);
      const successRate = value.total > 0 ? value.successes / value.total : 1;
      const errorRate = 1 - successRate;

      const { error: upsertErr } = await supabase
        .from('ai_performance_daily_agg')
        .upsert(
          {
            date: targetDate,
            provider,
            feature,
            avg_latency: avgLatency,
            error_rate: errorRate,
            success_rate: successRate,
            total_calls: value.total,
          },
          { onConflict: 'date,provider,feature' },
        );

      if (upsertErr) {
        errors.push(`Upsert failed for ${key}: ${upsertErr.message}`);
      } else {
        aggregated++;
      }
    }
  } catch (err) {
    errors.push(`Unexpected error: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  return { aggregated, errors };
}

/**
 * Update forecast state for all tenants with recent activity.
 */
export async function updateForecastState(
  supabase: any,
  targetDate: string,
): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Get distinct tenant+feature combos from recent cost data (last 14 days)
    const fourteenDaysAgo = new Date(new Date(targetDate).getTime() - 14 * 86400000)
      .toISOString().split('T')[0];

    const { data: recentCosts, error: costErr } = await supabase
      .from('ai_cost_daily_agg')
      .select('tenant_id, feature, date, total_cost')
      .gte('date', fourteenDaysAgo)
      .lte('date', targetDate)
      .order('date', { ascending: true });

    if (costErr) {
      errors.push(`Failed to query cost data: ${costErr.message}`);
      return { updated, errors };
    }

    // Group by tenant+feature
    const tenantFeatureMap = new Map<string, number[]>();
    for (const row of (recentCosts || [])) {
      const key = `${row.tenant_id}::${row.feature}`;
      const existing = tenantFeatureMap.get(key) || [];
      existing.push(row.total_cost);
      tenantFeatureMap.set(key, existing);
    }

    // Get performance data for SLA analysis
    const { data: perfData } = await supabase
      .from('ai_performance_daily_agg')
      .select('provider, feature, date, avg_latency, error_rate')
      .gte('date', fourteenDaysAgo)
      .lte('date', targetDate)
      .order('date', { ascending: true });

    // Split perf data into current (last 7 days) and previous (7 days before that)
    const sevenDaysAgo = new Date(new Date(targetDate).getTime() - 7 * 86400000)
      .toISOString().split('T')[0];

    const currentPerf: DailyPerformanceRow[] = [];
    const previousPerf: DailyPerformanceRow[] = [];
    for (const row of (perfData || [])) {
      if (row.date >= sevenDaysAgo) {
        currentPerf.push(row);
      } else {
        previousPerf.push(row);
      }
    }

    // Compute SLA trend (global, per feature)
    const featureSlaTrends = new Map<string, SlaTrendResult>();
    const featureSet = new Set<string>();
    for (const r of [...currentPerf, ...previousPerf]) featureSet.add(r.feature);

    for (const feature of featureSet) {
      const curLatencies = currentPerf.filter(r => r.feature === feature).map(r => r.avg_latency);
      const prevLatencies = previousPerf.filter(r => r.feature === feature).map(r => r.avg_latency);
      const curErrorRates = currentPerf.filter(r => r.feature === feature).map(r => r.error_rate);
      const prevErrorRates = previousPerf.filter(r => r.feature === feature).map(r => r.error_rate);

      const curErrorRate = curErrorRates.length > 0 ? curErrorRates.reduce((s, v) => s + v, 0) / curErrorRates.length : 0;
      const prevErrorRate = prevErrorRates.length > 0 ? prevErrorRates.reduce((s, v) => s + v, 0) / prevErrorRates.length : 0;

      featureSlaTrends.set(feature, computeSlaTrend(curLatencies, prevLatencies, curErrorRate, prevErrorRate));
    }

    // Get budget configs for risk calculation
    const tenantIds = [...new Set([...tenantFeatureMap.keys()].map(k => k.split('::')[0]))];
    let budgetMap = new Map<string, number>();
    if (tenantIds.length > 0) {
      const { data: budgets } = await supabase
        .from('tenant_ai_budget_config')
        .select('tenant_id, monthly_budget')
        .in('tenant_id', tenantIds);

      for (const b of (budgets || [])) {
        budgetMap.set(b.tenant_id, b.monthly_budget);
      }
    }

    // Update forecast state for each tenant+feature
    for (const [key, dailyCosts] of tenantFeatureMap) {
      const [tenantId, feature] = key.split('::');
      const monthlyBudget = budgetMap.get(tenantId) || 0;
      const costForecast = computeCostForecast(dailyCosts, monthlyBudget);
      const slaTrend = featureSlaTrends.get(feature) || {
        latencyDrift: 0, errorRateTrend: 0, slaRiskLevel: 'low' as SlaRiskLevel, performanceDriftScore: 0,
      };

      // Overall risk = max of budget risk and SLA risk
      const riskLevels: SlaRiskLevel[] = [costForecast.budgetRisk, slaTrend.slaRiskLevel];
      const riskOrder: Record<SlaRiskLevel, number> = { low: 0, medium: 1, high: 2 };
      const overallRisk = riskLevels.reduce((max, r) => riskOrder[r] > riskOrder[max] ? r : max, 'low' as SlaRiskLevel);

      const { error: upsertErr } = await supabase
        .from('ai_forecast_state')
        .upsert(
          {
            tenant_id: tenantId,
            feature,
            projected_monthly_cost: costForecast.projectedMonthlyCost,
            burn_rate: costForecast.burnRate,
            sla_risk_level: overallRisk,
            performance_drift_score: slaTrend.performanceDriftScore,
            last_updated: new Date().toISOString(),
          },
          { onConflict: 'tenant_id,feature' },
        );

      if (upsertErr) {
        errors.push(`Forecast upsert failed for ${key}: ${upsertErr.message}`);
      } else {
        updated++;
      }
    }
  } catch (err) {
    errors.push(`Unexpected error: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  return { updated, errors };
}

// ── Forecast-Aware Routing Hook ─────────────────────────────────

/**
 * Fetch forecast state for a tenant+feature and compute routing adjustments.
 * Fail-open: returns neutral adjustments on any error.
 */
export async function getForecastAdjustments(
  supabase: any,
  tenantId: string | null,
  feature: string,
): Promise<ForecastAdjustments> {
  const neutral: ForecastAdjustments = {
    costWeightMultiplier: 1.0,
    providerPenalty: 1.0,
    explorationBoost: false,
    tsAlphaDecay: 1.0,
    tsBetaDecay: 1.0,
  };

  if (!tenantId) return neutral;

  try {
    const { data, error } = await supabase
      .from('ai_forecast_state')
      .select('projected_monthly_cost, burn_rate, sla_risk_level, performance_drift_score')
      .eq('tenant_id', tenantId)
      .eq('feature', feature)
      .maybeSingle();

    if (error || !data) return neutral;

    // Get budget for risk context
    const { data: budgetData } = await supabase
      .from('tenant_ai_budget_config')
      .select('monthly_budget')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const monthlyBudget = budgetData?.monthly_budget || 0;
    const budgetRisk = computeBudgetRisk(data.projected_monthly_cost, monthlyBudget);

    return computeForecastAdjustments(
      budgetRisk,
      data.sla_risk_level as SlaRiskLevel,
      data.performance_drift_score,
    );
  } catch {
    return neutral;
  }
}
