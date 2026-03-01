/**
 * Pure logic helpers extracted from approvalGate.ts for unit testing.
 * Mirrors the edge function logic without Deno/Supabase dependencies.
 */

export const HIGH_RISK_QUESTION_COUNT = 25;
export const HIGH_RISK_TRIM_PERCENT = 0.25;

export interface HighRiskCheck {
  isHighRisk: boolean;
  reasons: string[];
}

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

export function detectPostExecutionHighRisk(batchDecision: string): HighRiskCheck {
  if (batchDecision === "regen_full") {
    return { isHighRisk: true, reasons: ["batch_quality_regen_full"] };
  }
  return { isHighRisk: false, reasons: [] };
}

const ADMIN_ROLES = ["tenant_admin", "super_admin"];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hashPayload(payload: Record<string, unknown>): string {
  const str = JSON.stringify(payload, Object.keys(payload).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return Math.abs(hash).toString(36);
}
