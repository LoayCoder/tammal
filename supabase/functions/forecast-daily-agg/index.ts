/**
 * Daily Forecast Aggregation Cron Job — PR-AI-INT-04
 *
 * Runs daily to:
 * 1. Aggregate yesterday's cost data into ai_cost_daily_agg
 * 2. Aggregate yesterday's performance data into ai_performance_daily_agg
 * 3. Update forecast state (projections, risk levels)
 *
 * Idempotent: safe to re-run for the same date.
 * Triggered by pg_cron or manual invocation.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  aggregateDailyCosts,
  aggregateDailyPerformance,
  updateForecastState,
} from "../generate-questions/forecastEngine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default to yesterday, allow override via request body
    let targetDate: string;
    try {
      const body = await req.json();
      targetDate = body.targetDate || getYesterday();
    } catch {
      targetDate = getYesterday();
    }

    console.log(`ForecastAgg: starting aggregation for ${targetDate}`);

    // Run all three aggregation steps
    const [costResult, perfResult] = await Promise.all([
      aggregateDailyCosts(supabase, targetDate),
      aggregateDailyPerformance(supabase, targetDate),
    ]);

    // Forecast state depends on aggregated data being present
    const forecastResult = await updateForecastState(supabase, targetDate);

    const durationMs = Math.round(performance.now() - startTime);

    const summary = {
      targetDate,
      durationMs,
      costs: { aggregated: costResult.aggregated, errors: costResult.errors.length },
      performance: { aggregated: perfResult.aggregated, errors: perfResult.errors.length },
      forecast: { updated: forecastResult.updated, errors: forecastResult.errors.length },
    };

    console.log(`ForecastAgg: completed in ${durationMs}ms`, JSON.stringify(summary));

    // Log any errors
    const allErrors = [
      ...costResult.errors.map(e => `[cost] ${e}`),
      ...perfResult.errors.map(e => `[perf] ${e}`),
      ...forecastResult.errors.map(e => `[forecast] ${e}`),
    ];
    if (allErrors.length > 0) {
      console.warn(`ForecastAgg: ${allErrors.length} errors:`, allErrors.join('; '));
    }

    return new Response(JSON.stringify({ success: true, ...summary, errors: allErrors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ForecastAgg: fatal error", error instanceof Error ? error.message : "unknown");
    return new Response(JSON.stringify({ error: "Aggregation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
