/**
 * CostGuard v2 — Soft Warning (80%) + Hard Block (100%)
 *
 * Checks tenant AI usage against configured limits before execution.
 * Creates at most one warning alert per tenant + month + feature + limit_type.
 * Never blocks below 100%. Never throws on warning path.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
  };

  // 1. Fetch tenant limits
  const { data: limits } = await supabase
    .from("ai_tenant_limits")
    .select("monthly_token_limit, monthly_cost_limit, warning_threshold_percent")
    .eq("tenant_id", tenantId)
    .single();

  // No limits configured → allow freely
  if (!limits) return result;

  const warningThreshold = limits.warning_threshold_percent ?? 80;

  // 2. Calculate current month usage from ai_generation_logs
  const now = new Date();
  const monthStart = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00Z`;
  const alertMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const { data: usageRows } = await supabase
    .from("ai_generation_logs")
    .select("tokens_used, duration_ms")
    .eq("tenant_id", tenantId)
    .gte("created_at", monthStart)
    .eq("success", true);

  const totalTokens = (usageRows || []).reduce((sum: number, r: any) => sum + (r.tokens_used || 0), 0);
  // Estimate cost: $0.001 per 1000 tokens (simplified)
  const estimatedCost = totalTokens / 1000 * 0.001;

  result.tokenPercent = limits.monthly_token_limit > 0 ? (totalTokens / limits.monthly_token_limit) * 100 : 0;
  result.costPercent = Number(limits.monthly_cost_limit) > 0 ? (estimatedCost / Number(limits.monthly_cost_limit)) * 100 : 0;

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

  // 4. Check soft warning (default 80%)
  if (result.tokenPercent >= warningThreshold) {
    result.warningTriggered = true;
    result.warningLimitType = "token";
    await createWarningAlert(supabase, tenantId, alertMonth, feature, "token", result.tokenPercent);
  }
  if (result.costPercent >= warningThreshold) {
    result.warningTriggered = true;
    result.warningLimitType = result.warningLimitType ? "both" : "cost";
    await createWarningAlert(supabase, tenantId, alertMonth, feature, "cost", result.costPercent);
  }

  return result;
}

// ── Alert spam prevention ──────────────────────────────────────────
async function createWarningAlert(
  supabase: SupabaseClient,
  tenantId: string,
  alertMonth: string,
  feature: string,
  limitType: string,
  percentUsed: number,
): Promise<void> {
  try {
    // Check if alert already exists for this tenant + month + feature + limit_type
    const { data: existing } = await supabase
      .from("ai_cost_alerts")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("alert_month", alertMonth)
      .eq("feature", feature)
      .eq("limit_type", limitType)
      .maybeSingle();

    if (existing) return; // Already alerted this month

    await supabase.from("ai_cost_alerts").insert({
      tenant_id: tenantId,
      alert_month: alertMonth,
      feature,
      limit_type: limitType,
      percent_used: percentUsed,
    });

    console.log(`CostGuard: warning alert created tenant=${tenantId.substring(0, 8)}… type=${limitType} percent=${percentUsed.toFixed(1)}`);
  } catch (err) {
    // Never block execution due to alert creation failure
    console.warn("CostGuard: failed to create warning alert", err instanceof Error ? err.message : "unknown");
  }
}
