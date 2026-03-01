/**
 * CostGuard v3.0 — Plan-Based + Override Limit Resolution
 *
 * Uses limitResolver to determine tenant limits from:
 *   1. Override (ai_tenant_limits)
 *   2. Plan (ai_plan_limits via ai_tenant_plan)
 *   3. None → unlimited
 *
 * Behavior unchanged:
 * - Hard block at 100% (throws CostLimitExceededError).
 * - Soft warning at configurable threshold (default 80%).
 * - Creates at most one alert per tenant + month + feature + limit_type.
 * - Never blocks below 100%. Never throws on warning/alert path.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveTenantAiLimits, type LimitsSource } from "./limitResolver.ts";

// ── Types ──────────────────────────────────────────────────────────
export interface CostGuardContext {
  tenantId: string;
  feature: string;
  supabase: SupabaseClient;
}

export interface CostCheckResult {
  allowed: boolean;
  tokenPercent: number;
  costPercent: number;
  warningTriggered: boolean;
  warningLimitType: string | null;
  blocked: boolean;
  blockedLimitType: string | null;
  /** The tenant's configured warning threshold (for telemetry) */
  threshold: number;
  /** Where limits were resolved from */
  limits_source: LimitsSource;
  /** The plan key if limits came from a plan */
  plan_key: string | null;
}

// ── Error ──────────────────────────────────────────────────────────
export class CostLimitExceededError extends Error {
  constructor(limitType: string, percent: number) {
    super(`AI cost limit exceeded (${limitType}: ${percent.toFixed(1)}%)`);
    this.name = "CostLimitExceededError";
  }
}

// ── Main check ─────────────────────────────────────────────────────
export async function checkBeforeExecution(ctx: CostGuardContext): Promise<CostCheckResult> {
  const { tenantId, feature, supabase } = ctx;

  const result: CostCheckResult = {
    allowed: true,
    tokenPercent: 0,
    costPercent: 0,
    warningTriggered: false,
    warningLimitType: null,
    blocked: false,
    blockedLimitType: null,
    threshold: 80,
    limits_source: "none",
    plan_key: null,
  };

  // 1. Resolve tenant limits (override → plan → none)
  const resolved = await resolveTenantAiLimits(supabase, tenantId);
  result.limits_source = resolved.source;
  result.plan_key = resolved.plan_key;
  result.threshold = resolved.warning_threshold_percent;

  // No limits configured → allow freely
  if (resolved.source === "none") return result;

  const tokenLimit = resolved.monthly_token_limit;
  const costLimit = resolved.monthly_cost_limit;
  const warningThreshold = resolved.warning_threshold_percent;

  // If both limits are null (unlimited), allow freely
  if (tokenLimit === null && costLimit === null) return result;

  // 2. Calculate current month usage from ai_generation_logs
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00Z`;
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const { data: usageRows } = await supabase
    .from("ai_generation_logs")
    .select("tokens_used, duration_ms")
    .eq("tenant_id", tenantId)
    .gte("created_at", monthStart)
    .eq("success", true);

  const totalTokens = (usageRows || []).reduce((sum: number, r: any) => sum + (r.tokens_used || 0), 0);
  const estimatedCost = totalTokens / 1000 * 0.001;

  result.tokenPercent = tokenLimit !== null && tokenLimit > 0 ? (totalTokens / tokenLimit) * 100 : 0;
  result.costPercent = costLimit !== null && costLimit > 0 ? (estimatedCost / costLimit) * 100 : 0;

  // 3. Check hard block (100%)
  if (result.tokenPercent >= 100) {
    result.allowed = false;
    result.blocked = true;
    result.blockedLimitType = "token";
    throw new CostLimitExceededError("token", result.tokenPercent);
  }
  if (result.costPercent >= 100) {
    result.allowed = false;
    result.blocked = true;
    result.blockedLimitType = "cost";
    throw new CostLimitExceededError("cost", result.costPercent);
  }

  // 4. Soft warning at configurable threshold
  if (result.tokenPercent >= warningThreshold) {
    result.warningTriggered = true;
    result.warningLimitType = "token";
    await createUsageAlertOnce(supabase, tenantId, feature, "token", monthKey, warningThreshold, result.tokenPercent);
  }
  if (result.costPercent >= warningThreshold) {
    result.warningTriggered = true;
    result.warningLimitType = result.warningLimitType ? "both" : "cost";
    await createUsageAlertOnce(supabase, tenantId, feature, "cost", monthKey, warningThreshold, result.costPercent);
  }

  return result;
}

// ── Alert creation with 23505 dedup ────────────────────────────────
async function createUsageAlertOnce(
  supabase: SupabaseClient,
  tenantId: string,
  feature: string,
  limitType: string,
  monthKey: string,
  thresholdPercent: number,
  currentPercent: number,
): Promise<void> {
  try {
    const { error } = await supabase.from("ai_usage_alerts").insert({
      tenant_id: tenantId,
      feature,
      limit_type: limitType,
      month_key: monthKey,
      threshold_percent: thresholdPercent,
      current_percent: currentPercent,
    });

    if (error) {
      if (error.code === "23505") return;
      console.warn(`CostGuard: alert insert failed code=${error.code} msg=${error.message}`);
    } else {
      console.log(
        `CostGuard: usage alert created tenant=${tenantId.substring(0, 8)}… type=${limitType} pct=${currentPercent.toFixed(1)} threshold=${thresholdPercent}`,
      );
    }
  } catch (err) {
    console.warn("CostGuard: alert creation threw", err instanceof Error ? err.message : "unknown");
  }
}
