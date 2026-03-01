/**
 * Feature Gate v1.0 — AI RBAC + Tenant Feature Flags
 *
 * Enforces two layers before an AI feature can execute:
 *   1. Feature Flag: Is the feature enabled for the tenant?
 *   2. RBAC: Does the user's role meet the minimum required role?
 *
 * Resolution uses existing user_roles + tenant_feature_flags tables.
 * Never throws on infrastructure errors — fails open with warning log.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ── Feature → minimum role map ─────────────────────────────────────
// Roles hierarchy: super_admin > tenant_admin > manager > user (employee)
export type AIFeatureKey =
  | "question_generation"
  | "prompt_rewrite"
  | "ai_critic_pass"
  | "quality_regen";

export type MinRole = "user" | "manager" | "tenant_admin";

export const FEATURE_ROLE_MAP: Record<AIFeatureKey, MinRole> = {
  question_generation: "user",       // any authenticated employee+
  prompt_rewrite: "user",            // any authenticated employee+
  ai_critic_pass: "tenant_admin",    // admin only
  quality_regen: "tenant_admin",     // admin only
};

// Ordered from lowest to highest privilege
const ROLE_HIERARCHY: string[] = [
  "user",
  "manager",
  "tenant_admin",
  "super_admin",
];

function roleLevel(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx >= 0 ? idx : 0; // unknown roles treated as lowest
}

// ── Types ──────────────────────────────────────────────────────────

export type DenialReason = "rbac" | "feature_disabled";

export interface FeatureGateResult {
  allowed: boolean;
  denied: boolean;
  reason: DenialReason | null;
  feature: AIFeatureKey;
  userRole: string;
  featureEnabled: boolean;
}

// ── Error ──────────────────────────────────────────────────────────

export class FeaturePermissionDeniedError extends Error {
  public readonly reason: DenialReason;
  public readonly feature: AIFeatureKey;

  constructor(reason: DenialReason, feature: AIFeatureKey) {
    const msg =
      reason === "feature_disabled"
        ? `AI feature '${feature}' is disabled for this tenant`
        : `Insufficient role to use AI feature '${feature}'`;
    super(msg);
    this.name = "PermissionDeniedError";
    this.reason = reason;
    this.feature = feature;
  }
}

// ── Resolve user's highest system role ─────────────────────────────

async function resolveUserRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!data || data.length === 0) return "user";

    // Find highest role
    let maxLevel = 0;
    let maxRole = "user";
    for (const row of data) {
      const level = roleLevel(row.role);
      if (level > maxLevel) {
        maxLevel = level;
        maxRole = row.role;
      }
    }
    return maxRole;
  } catch {
    // Fail open — assume lowest role
    console.warn("FeatureGate: failed to resolve user role, defaulting to 'user'");
    return "user";
  }
}

// ── Check feature flag for tenant ──────────────────────────────────

async function isFeatureEnabled(
  supabase: SupabaseClient,
  tenantId: string,
  featureKey: AIFeatureKey,
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("tenant_feature_flags")
      .select("enabled")
      .eq("tenant_id", tenantId)
      .eq("feature_key", featureKey)
      .single();

    // If no row, default to true (feature not explicitly configured)
    if (!data) return true;
    return data.enabled === true;
  } catch {
    // Fail open
    console.warn(`FeatureGate: failed to check feature flag '${featureKey}', defaulting to enabled`);
    return true;
  }
}

// ── Main gate check ────────────────────────────────────────────────

export async function checkFeatureGate(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
  feature: AIFeatureKey,
): Promise<FeatureGateResult> {
  // 1. Check feature flag first (cheaper check)
  const enabled = await isFeatureEnabled(supabase, tenantId, feature);

  if (!enabled) {
    throw new FeaturePermissionDeniedError("feature_disabled", feature);
  }

  // 2. RBAC check
  const userRole = await resolveUserRole(supabase, userId);
  const requiredRole = FEATURE_ROLE_MAP[feature] || "user";
  const userLevel = roleLevel(userRole);
  const requiredLevel = roleLevel(requiredRole);

  if (userLevel < requiredLevel) {
    throw new FeaturePermissionDeniedError("rbac", feature);
  }

  return {
    allowed: true,
    denied: false,
    reason: null,
    feature,
    userRole,
    featureEnabled: true,
  };
}
