/**
 * Approval Gate v1.0 — Admin approval for high-risk AI requests.
 *
 * High-risk criteria:
 *   1. questionCount > 25
 *   2. advancedSettings.enableCriticPass === true
 *   3. batchQuality.overallDecision === 'regen_full'
 *   4. contextBuilder trims > 25% of total budget
 *
 * If the caller is admin (tenant_admin or super_admin), high-risk requests
 * execute immediately. Otherwise, a pending request is created and 202 returned.
 *
 * On retry with a pending_request_id, the approved request executes normally.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// ── High-risk thresholds ────────────────────────────────────────
export const HIGH_RISK_QUESTION_COUNT = 25;
export const HIGH_RISK_TRIM_PERCENT = 0.25;

// ── Types ───────────────────────────────────────────────────────

export interface HighRiskCheck {
  isHighRisk: boolean;
  reasons: string[];
}

export interface ApprovalGateResult {
  /** true = request can proceed */
  allowed: boolean;
  /** If not allowed, this is the pending request ID */
  pendingRequestId: string | null;
  /** Reasons the request was flagged */
  reasons: string[];
}

// ── High-risk detection (pre-execution) ─────────────────────────

export function detectHighRisk(params: {
  questionCount: number;
  enableCriticPass: boolean;
  contextTrimPercent?: number;
}): HighRiskCheck {
  const reasons: string[] = [];

  if (params.questionCount > HIGH_RISK_QUESTION_COUNT) {
    reasons.push(`question_count_${params.questionCount}`);
  }
  if (params.enableCriticPass) {
    reasons.push("critic_pass_enabled");
  }
  if (
    typeof params.contextTrimPercent === "number" &&
    params.contextTrimPercent > HIGH_RISK_TRIM_PERCENT
  ) {
    reasons.push(`context_trimmed_${Math.round(params.contextTrimPercent * 100)}pct`);
  }

  return { isHighRisk: reasons.length > 0, reasons };
}

/**
 * Post-execution high-risk check for quality regen.
 * Called after batch quality evaluation.
 */
export function detectPostExecutionHighRisk(batchDecision: string): HighRiskCheck {
  if (batchDecision === "regen_full") {
    return { isHighRisk: true, reasons: ["batch_quality_regen_full"] };
  }
  return { isHighRisk: false, reasons: [] };
}

// ── Role check (reuses featureGate hierarchy) ───────────────────

const ADMIN_ROLES = ["tenant_admin", "super_admin"];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

// ── Simple hash for payload dedup ───────────────────────────────

export function hashPayload(payload: Record<string, unknown>): string {
  // Deterministic JSON string → simple hash
  const str = JSON.stringify(payload, Object.keys(payload).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return Math.abs(hash).toString(36);
}

// ── Create pending request ──────────────────────────────────────

export async function createPendingRequest(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    userId: string;
    feature: string;
    payload: Record<string, unknown>;
    reasons: string[];
  },
): Promise<string> {
  const payloadHash = hashPayload(params.payload);

  const { data, error } = await supabase
    .from("ai_pending_requests")
    .insert({
      tenant_id: params.tenantId,
      user_id: params.userId,
      feature: params.feature,
      request_payload_hash: payloadHash,
      request_payload: params.payload,
      risk_reasons: params.reasons,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("ApprovalGate: failed to create pending request", error.message);
    throw new Error("Failed to create pending approval request");
  }

  return data.id;
}

// ── Check if a pending request is approved ──────────────────────

export async function checkPendingApproval(
  supabase: SupabaseClient,
  pendingRequestId: string,
  userId: string,
): Promise<{ approved: boolean; status: string }> {
  const { data, error } = await supabase
    .from("ai_pending_requests")
    .select("status, user_id")
    .eq("id", pendingRequestId)
    .single();

  if (error || !data) {
    return { approved: false, status: "not_found" };
  }

  // Verify the requester owns this pending request
  if (data.user_id !== userId) {
    return { approved: false, status: "not_owner" };
  }

  return { approved: data.status === "approved", status: data.status };
}

// ── Main gate check (pre-execution) ─────────────────────────────

export async function checkApprovalGate(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    userId: string;
    userRole: string;
    feature: string;
    questionCount: number;
    enableCriticPass: boolean;
    contextTrimPercent?: number;
    pendingRequestId?: string;
    requestPayload: Record<string, unknown>;
  },
): Promise<ApprovalGateResult> {
  // If retrying with a pending_request_id, check approval
  if (params.pendingRequestId) {
    const approval = await checkPendingApproval(
      supabase,
      params.pendingRequestId,
      params.userId,
    );
    if (approval.approved) {
      console.log(
        `ApprovalGate: pending request ${params.pendingRequestId} approved, executing`,
      );
      return { allowed: true, pendingRequestId: null, reasons: [] };
    }
    // Not yet approved
    return {
      allowed: false,
      pendingRequestId: params.pendingRequestId,
      reasons: [`pending_status_${approval.status}`],
    };
  }

  // Detect high-risk
  const risk = detectHighRisk({
    questionCount: params.questionCount,
    enableCriticPass: params.enableCriticPass,
    contextTrimPercent: params.contextTrimPercent,
  });

  if (!risk.isHighRisk) {
    return { allowed: true, pendingRequestId: null, reasons: [] };
  }

  // Admin bypasses approval gate
  if (isAdminRole(params.userRole)) {
    console.log(
      `ApprovalGate: admin bypass for high-risk request reasons=[${risk.reasons.join(",")}]`,
    );
    return { allowed: true, pendingRequestId: null, reasons: risk.reasons };
  }

  // Non-admin + high-risk → create pending request
  const pendingId = await createPendingRequest(supabase, {
    tenantId: params.tenantId,
    userId: params.userId,
    feature: params.feature,
    payload: params.requestPayload,
    reasons: risk.reasons,
  });

  console.log(
    `ApprovalGate: pending request created id=${pendingId} reasons=[${risk.reasons.join(",")}]`,
  );

  return {
    allowed: false,
    pendingRequestId: pendingId,
    reasons: risk.reasons,
  };
}
