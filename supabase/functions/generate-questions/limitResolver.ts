/**
 * Limit Resolver v1.0 — Plan-Based AI Limit Resolution
 *
 * Resolution order:
 *   1. Override (ai_tenant_limits — existing table, treated as tenant-specific override)
 *   2. Plan defaults (ai_plan_limits via ai_tenant_plan)
 *   3. None → unlimited (null limits, threshold=80)
 *
 * Never throws — returns safe defaults on any failure.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type LimitsSource = "override" | "plan" | "none";

export interface ResolvedLimits {
  monthly_token_limit: number | null;
  monthly_cost_limit: number | null;
  warning_threshold_percent: number;
  source: LimitsSource;
  plan_key: string | null;
}

const DEFAULT_THRESHOLD = 80;

function validThreshold(raw: unknown): number {
  if (typeof raw === "number" && raw >= 1 && raw <= 99) return raw;
  return DEFAULT_THRESHOLD;
}

function validLimit(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (isNaN(n) || n < 0) return null;
  return n;
}

export async function resolveTenantAiLimits(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<ResolvedLimits> {
  // 1. Check override (existing ai_tenant_limits table)
  try {
    const { data: override } = await supabase
      .from("ai_tenant_limits")
      .select("monthly_token_limit, monthly_cost_limit, warning_threshold_percent")
      .eq("tenant_id", tenantId)
      .single();

    if (override) {
      return {
        monthly_token_limit: validLimit(override.monthly_token_limit),
        monthly_cost_limit: validLimit(override.monthly_cost_limit),
        warning_threshold_percent: validThreshold(override.warning_threshold_percent),
        source: "override",
        plan_key: null,
      };
    }
  } catch {
    // No override row or error — continue to plan lookup
  }

  // 2. Check plan-based limits
  try {
    const { data: tenantPlan } = await supabase
      .from("ai_tenant_plan")
      .select("plan_key")
      .eq("tenant_id", tenantId)
      .single();

    if (tenantPlan?.plan_key) {
      const { data: planLimits } = await supabase
        .from("ai_plan_limits")
        .select("monthly_token_limit, monthly_cost_limit, warning_threshold_percent")
        .eq("plan_key", tenantPlan.plan_key)
        .single();

      if (planLimits) {
        return {
          monthly_token_limit: validLimit(planLimits.monthly_token_limit),
          monthly_cost_limit: validLimit(planLimits.monthly_cost_limit),
          warning_threshold_percent: validThreshold(planLimits.warning_threshold_percent),
          source: "plan",
          plan_key: tenantPlan.plan_key,
        };
      }
    }
  } catch {
    // Plan lookup failed — fall through to none
  }

  // 3. No limits configured
  return {
    monthly_token_limit: null,
    monthly_cost_limit: null,
    warning_threshold_percent: DEFAULT_THRESHOLD,
    source: "none",
    plan_key: null,
  };
}
