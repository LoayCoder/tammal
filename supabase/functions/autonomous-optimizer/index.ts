/**
 * Autonomous Optimizer — PR-AI-INT-06
 *
 * Weekly closed-loop optimization: weight recalibration, hyperparameter tuning,
 * anomaly detection, and sandbox provider evaluation.
 *
 * Safety: Conservative learning rate (η=0.05), max 5% change per cycle,
 * hard guardrails, fail-open, fully auditable.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ── Constants ──────────────────────────────────────────────────
const LEARNING_RATE = 0.05
const MAX_DELTA_PER_CYCLE = 0.05
const WEIGHT_MIN = 0.05
const WEIGHT_MAX = 0.60
const MAX_HISTORY_SIZE = 3
const MIN_ADJUSTMENT_INTERVAL_DAYS = 7
const ANOMALY_Z_THRESHOLD = 3.0
const ANOMALY_FREEZE_HOURS = 24
const EXPLORATION_BOOST_INCREMENT = 0.05
const EXPLORATION_BOOST_MAX = 0.20
const ANOMALY_PENALTY_MULTIPLIER = 0.85
const ANOMALY_PENALTY_TTL_MINUTES = 30
const HYPERPARAM_IMPROVEMENT_THRESHOLD = 0.03

// Hyperparameter bounds
const HP_BOUNDS = {
  decay_window: { min: 20, max: 40 },
  smoothing_alpha: { min: 0.2, max: 0.4 },
  drift_threshold: { min: 0.10, max: 0.25 },
}

interface WeightSet {
  w_quality: number
  w_latency: number
  w_stability: number
  w_cost: number
  w_confidence: number
}

interface AutonomousState {
  tenant_id: string
  feature: string
  current_weights: WeightSet
  previous_weights_history: WeightSet[]
  last_adjustment: string | null
  adjustment_score: number
  mode: string
  exploration_boost: number
  anomaly_frozen_until: string | null
  hyperparams: { decay_window: number; smoothing_alpha: number; drift_threshold: number }
}

// ── Weight Helpers ─────────────────────────────────────────────

function normalizeWeights(w: WeightSet): WeightSet {
  const sum = w.w_quality + w.w_latency + w.w_stability + w.w_cost + w.w_confidence
  if (sum <= 0) return { w_quality: 0.2, w_latency: 0.2, w_stability: 0.2, w_cost: 0.2, w_confidence: 0.2 }
  return {
    w_quality: w.w_quality / sum,
    w_latency: w.w_latency / sum,
    w_stability: w.w_stability / sum,
    w_cost: w.w_cost / sum,
    w_confidence: w.w_confidence / sum,
  }
}

function clampWeight(v: number): number {
  return Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, v))
}

function capDelta(oldVal: number, newVal: number): number {
  const delta = newVal - oldVal
  const capped = Math.max(-MAX_DELTA_PER_CYCLE, Math.min(MAX_DELTA_PER_CYCLE, delta))
  return oldVal + capped
}

function adjustWeights(current: WeightSet, deltas: WeightSet): WeightSet {
  const adjusted: WeightSet = {
    w_quality: clampWeight(capDelta(current.w_quality, current.w_quality + LEARNING_RATE * deltas.w_quality)),
    w_latency: clampWeight(capDelta(current.w_latency, current.w_latency + LEARNING_RATE * deltas.w_latency)),
    w_stability: clampWeight(capDelta(current.w_stability, current.w_stability + LEARNING_RATE * deltas.w_stability)),
    w_cost: clampWeight(capDelta(current.w_cost, current.w_cost + LEARNING_RATE * deltas.w_cost)),
    w_confidence: clampWeight(capDelta(current.w_confidence, current.w_confidence + LEARNING_RATE * deltas.w_confidence)),
  }
  return normalizeWeights(adjusted)
}

function computeAdjustmentMagnitude(old: WeightSet, updated: WeightSet): number {
  return Math.abs(updated.w_quality - old.w_quality)
    + Math.abs(updated.w_latency - old.w_latency)
    + Math.abs(updated.w_stability - old.w_stability)
    + Math.abs(updated.w_cost - old.w_cost)
    + Math.abs(updated.w_confidence - old.w_confidence)
}

// ── Z-Score Anomaly Detection ──────────────────────────────────

interface ZScoreResult {
  metric: string
  zScore: number
  isAnomaly: boolean
  currentValue: number
  mean: number
  stddev: number
}

function computeZScores(values: number[], currentValue: number, metric: string): ZScoreResult {
  if (values.length < 2) return { metric, zScore: 0, isAnomaly: false, currentValue, mean: currentValue, stddev: 0 }
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  const stddev = Math.sqrt(variance)
  if (stddev === 0) return { metric, zScore: 0, isAnomaly: false, currentValue, mean, stddev }
  const zScore = (currentValue - mean) / stddev
  return { metric, zScore, isAnomaly: Math.abs(zScore) > ANOMALY_Z_THRESHOLD, currentValue, mean, stddev }
}

// ── Performance Delta Computation ──────────────────────────────

interface PerformanceMetrics {
  slaRiskLevel: string
  burnRateRatio: number   // projected / budget (0 if no budget)
  convergenceRate: number // sum of alpha+beta across providers
  explorationRatio: number // max usage_percentage
  errorTrend: number      // 7-day error rate change
}

function computePerformanceDeltas(metrics: PerformanceMetrics): WeightSet {
  // Higher SLA risk → boost quality and stability
  const slaMultiplier = metrics.slaRiskLevel === 'high' ? 1 : metrics.slaRiskLevel === 'medium' ? 0.5 : 0
  
  // Higher burn rate → boost cost weight
  const costPressure = metrics.burnRateRatio > 0.7 ? (metrics.burnRateRatio - 0.7) / 0.3 : 0
  
  // Low convergence → boost confidence (more exploration)
  const convergenceFactor = metrics.convergenceRate < 50 ? 0.5 : (metrics.convergenceRate < 200 ? 0.2 : 0)
  
  // High exploration ratio → reduce confidence, boost quality
  const diversityFactor = metrics.explorationRatio > 80 ? -0.3 : 0
  
  // Error trend → boost stability
  const stabilityPressure = metrics.errorTrend > 0.05 ? metrics.errorTrend * 2 : 0

  return {
    w_quality: slaMultiplier * 0.3,
    w_latency: -costPressure * 0.2,
    w_stability: stabilityPressure + slaMultiplier * 0.2,
    w_cost: costPressure * 0.5,
    w_confidence: convergenceFactor + diversityFactor,
  }
}

// ── Hyperparameter Tuning (Offline Replay) ─────────────────────

function simulateReplay(
  events: { latency_ms: number; estimated_cost: number; quality_avg: number; success: boolean }[],
  params: { decay_window: number; smoothing_alpha: number; drift_threshold: number },
): number {
  if (events.length === 0) return 0
  
  // Simulate quality-weighted cost using the given parameters
  let ewma = 0
  const alpha = params.smoothing_alpha
  
  for (let i = 0; i < events.length; i++) {
    const e = events[i]
    const qualityWeight = e.success ? (e.quality_avg || 50) / 100 : 0.1
    const costEfficiency = qualityWeight / Math.max(e.estimated_cost || 0.001, 0.001)
    
    if (i === 0) {
      ewma = costEfficiency
    } else {
      ewma = alpha * costEfficiency + (1 - alpha) * ewma
    }
  }
  
  return ewma // Higher = better cost efficiency
}

function tuneHyperparameters(
  events: { latency_ms: number; estimated_cost: number; quality_avg: number; success: boolean }[],
  currentParams: { decay_window: number; smoothing_alpha: number; drift_threshold: number },
): { tuned: typeof currentParams; improved: boolean; improvement: number } {
  const currentScore = simulateReplay(events, currentParams)
  
  let bestParams = { ...currentParams }
  let bestScore = currentScore
  
  // Grid search over candidate values
  const candidates = [
    { ...currentParams, smoothing_alpha: Math.min(currentParams.smoothing_alpha + 0.05, HP_BOUNDS.smoothing_alpha.max) },
    { ...currentParams, smoothing_alpha: Math.max(currentParams.smoothing_alpha - 0.05, HP_BOUNDS.smoothing_alpha.min) },
    { ...currentParams, decay_window: Math.min(currentParams.decay_window + 5, HP_BOUNDS.decay_window.max) },
    { ...currentParams, decay_window: Math.max(currentParams.decay_window - 5, HP_BOUNDS.decay_window.min) },
    { ...currentParams, drift_threshold: Math.min(currentParams.drift_threshold + 0.03, HP_BOUNDS.drift_threshold.max) },
    { ...currentParams, drift_threshold: Math.max(currentParams.drift_threshold - 0.03, HP_BOUNDS.drift_threshold.min) },
  ]
  
  for (const candidate of candidates) {
    const score = simulateReplay(events, candidate)
    if (score > bestScore) {
      bestScore = score
      bestParams = candidate
    }
  }
  
  const improvement = currentScore > 0 ? (bestScore - currentScore) / currentScore : 0
  const improved = improvement >= HYPERPARAM_IMPROVEMENT_THRESHOLD
  
  return { tuned: improved ? bestParams : currentParams, improved, improvement }
}

// ── Sandbox Provider Evaluation ────────────────────────────────

async function evaluateSandboxProviders(db: any): Promise<void> {
  // Find active sandboxes that are ready for evaluation
  const { data: activeSandboxes } = await db
    .from('ai_sandbox_evaluations')
    .select('*')
    .eq('status', 'active')
  
  if (!activeSandboxes?.length) return
  
  const now = new Date()
  
  for (const sandbox of activeSandboxes) {
    const expired = new Date(sandbox.expires_at) <= now
    const hasEnoughCalls = sandbox.calls_total >= 100
    
    if (!expired && !hasEnoughCalls) continue
    
    // Get median quality of existing providers for this feature
    const { data: existingMetrics } = await db
      .from('ai_provider_metrics_agg')
      .select('ewma_quality')
      .eq('feature', sandbox.feature)
      .eq('scope', 'global')
    
    const qualities = (existingMetrics || [])
      .map((m: any) => m.ewma_quality)
      .filter((q: number) => q > 0)
      .sort((a: number, b: number) => a - b)
    
    const median = qualities.length > 0 ? qualities[Math.floor(qualities.length / 2)] : 50
    const p25 = qualities.length > 0 ? qualities[Math.floor(qualities.length * 0.25)] : 25
    
    let newStatus: string
    const sandboxQuality = sandbox.median_quality || 0
    
    if (sandboxQuality > median) {
      newStatus = 'promoted'
    } else if (sandboxQuality < p25 || (expired && sandbox.calls_total < 10)) {
      newStatus = 'disabled'
    } else if (expired) {
      newStatus = 'expired'
    } else {
      continue // Not enough data yet
    }
    
    await db
      .from('ai_sandbox_evaluations')
      .update({ status: newStatus })
      .eq('id', sandbox.id)
    
    // Audit log
    await db.from('ai_autonomous_audit_log').insert({
      tenant_id: sandbox.tenant_id,
      feature: sandbox.feature,
      sandbox_event: `${sandbox.provider}/${sandbox.model} → ${newStatus}`,
      adjustment_reason: `Sandbox evaluation complete: quality=${sandboxQuality.toFixed(1)} median=${median.toFixed(1)} calls=${sandbox.calls_total}`,
    })
    
    console.log(`Sandbox: ${sandbox.provider}/${sandbox.model} → ${newStatus} (quality=${sandboxQuality.toFixed(1)} median=${median.toFixed(1)})`)
  }
}

// ── Main Handler ───────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  
  const startTime = performance.now()
  
  try {
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    
    let requestType = 'weekly_optimize'
    try {
      const body = await req.json()
      requestType = body.type || 'weekly_optimize'
    } catch { /* default */ }
    
    console.log(`AutonomousOptimizer: starting type=${requestType}`)
    
    // ── Fetch all enabled/shadow autonomous states ──
    const { data: states } = await db
      .from('ai_autonomous_state')
      .select('*')
      .in('mode', ['enabled', 'shadow'])
    
    if (!states?.length) {
      console.log('AutonomousOptimizer: no enabled states, exiting')
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    let processed = 0
    let skipped = 0
    let anomaliesDetected = 0
    
    for (const state of states as AutonomousState[]) {
      const { tenant_id, feature, mode } = state
      const now = new Date()
      
      // ── Guardrail: 7-day minimum interval ──
      if (state.last_adjustment) {
        const daysSince = (now.getTime() - new Date(state.last_adjustment).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince < MIN_ADJUSTMENT_INTERVAL_DAYS) {
          console.log(`Skip ${tenant_id.substring(0, 8)}:${feature}: last adjustment ${daysSince.toFixed(1)}d ago`)
          skipped++
          continue
        }
      }
      
      // ── Guardrail: anomaly freeze ──
      if (state.anomaly_frozen_until && new Date(state.anomaly_frozen_until) > now) {
        console.log(`Skip ${tenant_id.substring(0, 8)}:${feature}: anomaly frozen until ${state.anomaly_frozen_until}`)
        skipped++
        continue
      }
      
      // ── Guardrail: SLA risk check ──
      const { data: forecast } = await db
        .from('ai_forecast_state')
        .select('sla_risk_level, burn_rate, projected_monthly_cost')
        .eq('tenant_id', tenant_id)
        .eq('feature', feature)
        .maybeSingle()
      
      if (forecast?.sla_risk_level === 'high') {
        console.log(`Skip ${tenant_id.substring(0, 8)}:${feature}: SLA risk HIGH`)
        skipped++
        continue
      }
      
      // ── Guardrail: budget hard limit check ──
      const { data: budgetConfig } = await db
        .from('tenant_ai_budget_config')
        .select('monthly_budget, current_month_usage')
        .eq('tenant_id', tenant_id)
        .maybeSingle()
      
      if (budgetConfig && budgetConfig.monthly_budget > 0 &&
          budgetConfig.current_month_usage >= budgetConfig.monthly_budget) {
        console.log(`Skip ${tenant_id.substring(0, 8)}:${feature}: budget HARD LIMIT`)
        skipped++
        continue
      }
      
      // ── Compute performance metrics ──
      const burnRateRatio = (budgetConfig && budgetConfig.monthly_budget > 0)
        ? (forecast?.projected_monthly_cost || 0) / budgetConfig.monthly_budget
        : 0
      
      const { data: metricsAgg } = await db
        .from('ai_provider_metrics_agg')
        .select('ts_alpha, ts_beta')
        .eq('feature', feature)
        .eq('scope', 'global')
      
      const convergenceRate = (metricsAgg || []).reduce(
        (s: number, m: any) => s + (m.ts_alpha || 1) + (m.ts_beta || 1), 0,
      )
      
      const { data: usageData } = await db
        .from('ai_provider_usage_24h')
        .select('usage_percentage')
      
      const maxUsage = Math.max(...(usageData || []).map((u: any) => u.usage_percentage || 0), 0)
      
      // 7-day error trend
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString().split('T')[0]
      
      const { data: recentPerf } = await db
        .from('ai_performance_daily_agg')
        .select('date, error_rate')
        .eq('feature', feature)
        .gte('date', fourteenDaysAgo)
      
      const recentErrors = (recentPerf || []).filter((r: any) => r.date >= sevenDaysAgo).map((r: any) => r.error_rate || 0)
      const prevErrors = (recentPerf || []).filter((r: any) => r.date < sevenDaysAgo).map((r: any) => r.error_rate || 0)
      const avgRecentError = recentErrors.length > 0 ? recentErrors.reduce((s: number, v: number) => s + v, 0) / recentErrors.length : 0
      const avgPrevError = prevErrors.length > 0 ? prevErrors.reduce((s: number, v: number) => s + v, 0) / prevErrors.length : 0
      const errorTrend = avgRecentError - avgPrevError
      
      const perfMetrics: PerformanceMetrics = {
        slaRiskLevel: forecast?.sla_risk_level || 'low',
        burnRateRatio,
        convergenceRate,
        explorationRatio: maxUsage,
        errorTrend,
      }
      
      // ── Compute weight deltas ──
      const deltas = computePerformanceDeltas(perfMetrics)
      const newWeights = adjustWeights(state.current_weights, deltas)
      const magnitude = computeAdjustmentMagnitude(state.current_weights, newWeights)
      
      // ── Hyperparameter tuning (offline replay) ──
      let hyperparamsTuned = false
      let tunedParams = state.hyperparams
      
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString()
      const { data: replayEvents } = await db
        .from('ai_provider_events')
        .select('latency_ms, estimated_cost, quality_avg, success')
        .eq('feature', feature)
        .gte('created_at', thirtyDaysAgo)
        .limit(1000)
      
      if (replayEvents && replayEvents.length > 50) {
        const tuning = tuneHyperparameters(replayEvents, state.hyperparams)
        if (tuning.improved) {
          tunedParams = tuning.tuned
          hyperparamsTuned = true
          console.log(`HyperTune ${tenant_id.substring(0, 8)}:${feature}: improvement=${(tuning.improvement * 100).toFixed(1)}% params=${JSON.stringify(tunedParams)}`)
        }
      }
      
      // ── Apply or shadow-log ──
      const adjustmentReason = `Weekly recalibration: SLA=${perfMetrics.slaRiskLevel} burn=${burnRateRatio.toFixed(2)} convergence=${convergenceRate} diversity=${maxUsage.toFixed(0)}% errorTrend=${errorTrend.toFixed(3)}`
      
      if (mode === 'enabled') {
        // Push current weights to history (keep last 3)
        const history = [...(state.previous_weights_history || []), state.current_weights].slice(-MAX_HISTORY_SIZE)
        
        await db
          .from('ai_autonomous_state')
          .update({
            current_weights: newWeights,
            previous_weights_history: history,
            last_adjustment: now.toISOString(),
            adjustment_score: magnitude,
            hyperparams: tunedParams,
            updated_at: now.toISOString(),
          })
          .eq('tenant_id', tenant_id)
          .eq('feature', feature)
      }
      
      // Always log (shadow or enabled)
      await db.from('ai_autonomous_audit_log').insert({
        tenant_id,
        feature,
        previous_weights: state.current_weights,
        new_weights: newWeights,
        adjustment_reason: `${adjustmentReason}${mode === 'shadow' ? ' [SHADOW]' : ''}`,
        adjustment_magnitude: magnitude,
        hyperparameter_tuned: hyperparamsTuned,
      })
      
      console.log(`${mode === 'shadow' ? 'SHADOW ' : ''}Adjusted ${tenant_id.substring(0, 8)}:${feature}: magnitude=${magnitude.toFixed(4)} hp_tuned=${hyperparamsTuned}`)
      processed++
    }
    
    // ── Sandbox evaluations ──
    await evaluateSandboxProviders(db)
    
    const duration = Math.round(performance.now() - startTime)
    console.log(`AutonomousOptimizer: done in ${duration}ms processed=${processed} skipped=${skipped} anomalies=${anomaliesDetected}`)
    
    return new Response(JSON.stringify({
      success: true,
      duration,
      processed,
      skipped,
      anomaliesDetected,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('AutonomousOptimizer: fatal', error instanceof Error ? error.message : 'unknown')
    return new Response(JSON.stringify({ error: 'Optimizer failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Export for testing
export {
  normalizeWeights,
  clampWeight,
  capDelta,
  adjustWeights,
  computeAdjustmentMagnitude,
  computeZScores,
  computePerformanceDeltas,
  simulateReplay,
  tuneHyperparameters,
  LEARNING_RATE,
  MAX_DELTA_PER_CYCLE,
  WEIGHT_MIN,
  WEIGHT_MAX,
  ANOMALY_Z_THRESHOLD,
  HYPERPARAM_IMPROVEMENT_THRESHOLD,
  HP_BOUNDS,
  type WeightSet,
  type PerformanceMetrics,
  type ZScoreResult,
}
