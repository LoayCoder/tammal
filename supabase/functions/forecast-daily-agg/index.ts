/**
 * Daily Forecast Aggregation Cron Job — PR-AI-INT-04
 *
 * Runs daily to aggregate cost/performance data and update forecast state.
 * Idempotent: safe to re-run for the same date.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Inline forecast logic (can't import across edge function dirs) ──

type SlaRiskLevel = 'low' | 'medium' | 'high';

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

function computeBurnRate(dailyCosts: number[]) {
  if (dailyCosts.length === 0) return { burnRate: 0, projectedMonthlyCost: 0 };
  const window = dailyCosts.slice(-7);
  const total = window.reduce((s, c) => s + c, 0);
  const burnRate = total / Math.max(window.length, 1);
  return { burnRate, projectedMonthlyCost: burnRate * 30 };
}

function computeBudgetRisk(projected: number, budget: number): SlaRiskLevel {
  if (budget <= 0) return 'low';
  const ratio = projected / budget;
  if (ratio > 0.9) return 'high';
  if (ratio > 0.7) return 'medium';
  return 'low';
}

function computeLatencyDrift(cur: number[], prev: number[]): number {
  if (!prev.length || !cur.length) return 0;
  const cm = cur.reduce((s, v) => s + v, 0) / cur.length;
  const pm = prev.reduce((s, v) => s + v, 0) / prev.length;
  return pm <= 0 ? 0 : (cm - pm) / pm;
}

function computeSlaRisk(latDrift: number, errTrend: number): SlaRiskLevel {
  if (latDrift > 0.30 || errTrend > 0.10) return 'high';
  if (latDrift > 0.15 || errTrend > 0.05) return 'medium';
  return 'low';
}

function computeDriftScore(latDrift: number, errTrend: number): number {
  return clamp01(0.6 * clamp01(Math.abs(latDrift) / 0.5) + 0.4 * clamp01(Math.abs(errTrend) / 0.2));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = performance.now();
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let targetDate: string;
    try { const body = await req.json(); targetDate = body.targetDate || getYesterday(); }
    catch { targetDate = getYesterday(); }

    console.log(`ForecastAgg: starting for ${targetDate}`);

    // 1. Aggregate costs
    const startOfDay = `${targetDate}T00:00:00Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    const { data: events } = await supabase
      .from('ai_provider_events')
      .select('tenant_id, feature, provider, estimated_cost, latency_ms, success')
      .gte('created_at', startOfDay).lte('created_at', endOfDay);

    let costAgg = 0, perfAgg = 0;
    if (events && events.length > 0) {
      // Cost aggregation by tenant+feature+provider
      const costGroups = new Map<string, { cost: number; calls: number }>();
      const perfGroups = new Map<string, { latencies: number[]; successes: number; total: number }>();

      for (const e of events) {
        if (e.tenant_id) {
          const ck = `${e.tenant_id}::${e.feature}::${e.provider}`;
          const ce = costGroups.get(ck) || { cost: 0, calls: 0 };
          ce.cost += e.estimated_cost || 0; ce.calls++; costGroups.set(ck, ce);
        }
        const pk = `${e.provider}::${e.feature}`;
        const pe = perfGroups.get(pk) || { latencies: [], successes: 0, total: 0 };
        pe.latencies.push(e.latency_ms || 0); if (e.success) pe.successes++; pe.total++;
        perfGroups.set(pk, pe);
      }

      for (const [key, val] of costGroups) {
        const [tid, feat, prov] = key.split('::');
        await supabase.from('ai_cost_daily_agg').upsert({
          date: targetDate, tenant_id: tid, feature: feat, provider: prov,
          total_cost: val.cost, total_calls: val.calls, avg_cost_per_call: val.calls > 0 ? val.cost / val.calls : 0,
        }, { onConflict: 'date,tenant_id,feature,provider' });
        costAgg++;
      }

      for (const [key, val] of perfGroups) {
        const [prov, feat] = key.split('::');
        const avgLat = val.latencies.reduce((s, v) => s + v, 0) / Math.max(val.latencies.length, 1);
        const sr = val.total > 0 ? val.successes / val.total : 1;
        await supabase.from('ai_performance_daily_agg').upsert({
          date: targetDate, provider: prov, feature: feat,
          avg_latency: avgLat, error_rate: 1 - sr, success_rate: sr, total_calls: val.total,
        }, { onConflict: 'date,provider,feature' });
        perfAgg++;
      }
    }

    // 2. Update forecast state
    const fourteenDaysAgo = new Date(new Date(targetDate).getTime() - 14 * 86400000).toISOString().split('T')[0];
    const sevenDaysAgo = new Date(new Date(targetDate).getTime() - 7 * 86400000).toISOString().split('T')[0];

    const { data: recentCosts } = await supabase.from('ai_cost_daily_agg')
      .select('tenant_id, feature, total_cost').gte('date', fourteenDaysAgo).lte('date', targetDate);

    const tfMap = new Map<string, number[]>();
    for (const r of (recentCosts || [])) {
      const k = `${r.tenant_id}::${r.feature}`;
      (tfMap.get(k) || (tfMap.set(k, []), tfMap.get(k)!)).push(r.total_cost);
    }

    const { data: perfData } = await supabase.from('ai_performance_daily_agg')
      .select('feature, date, avg_latency, error_rate').gte('date', fourteenDaysAgo).lte('date', targetDate);

    const tenantIds = [...new Set([...tfMap.keys()].map(k => k.split('::')[0]))];
    const budgetMap = new Map<string, number>();
    if (tenantIds.length > 0) {
      const { data: budgets } = await supabase.from('tenant_ai_budget_config')
        .select('tenant_id, monthly_budget').in('tenant_id', tenantIds);
      for (const b of (budgets || [])) budgetMap.set(b.tenant_id, b.monthly_budget);
    }

    let forecastUpdated = 0;
    for (const [key, costs] of tfMap) {
      const [tenantId, feature] = key.split('::');
      const { burnRate, projectedMonthlyCost } = computeBurnRate(costs);
      const budget = budgetMap.get(tenantId) || 0;
      const budgetRisk = computeBudgetRisk(projectedMonthlyCost, budget);

      const curLats = (perfData || []).filter(r => r.feature === feature && r.date >= sevenDaysAgo).map(r => r.avg_latency);
      const prevLats = (perfData || []).filter(r => r.feature === feature && r.date < sevenDaysAgo).map(r => r.avg_latency);
      const curErr = (perfData || []).filter(r => r.feature === feature && r.date >= sevenDaysAgo).map(r => r.error_rate);
      const prevErr = (perfData || []).filter(r => r.feature === feature && r.date < sevenDaysAgo).map(r => r.error_rate);
      const latDrift = computeLatencyDrift(curLats, prevLats);
      const ce = curErr.length ? curErr.reduce((s, v) => s + v, 0) / curErr.length : 0;
      const pe = prevErr.length ? prevErr.reduce((s, v) => s + v, 0) / prevErr.length : 0;
      const slaRisk = computeSlaRisk(latDrift, ce - pe);
      const driftScore = computeDriftScore(latDrift, ce - pe);

      const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
      const overall = riskOrder[slaRisk] > riskOrder[budgetRisk] ? slaRisk : budgetRisk;

      await supabase.from('ai_forecast_state').upsert({
        tenant_id: tenantId, feature, projected_monthly_cost: projectedMonthlyCost,
        burn_rate: burnRate, sla_risk_level: overall, performance_drift_score: driftScore,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'tenant_id,feature' });
      forecastUpdated++;
    }

    const duration = Math.round(performance.now() - startTime);
    console.log(`ForecastAgg: done in ${duration}ms costs=${costAgg} perf=${perfAgg} forecasts=${forecastUpdated}`);

    return new Response(JSON.stringify({ success: true, targetDate, duration, costAgg, perfAgg, forecastUpdated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ForecastAgg: fatal", error instanceof Error ? error.message : "unknown");
    return new Response(JSON.stringify({ error: "Aggregation failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getYesterday(): string {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
