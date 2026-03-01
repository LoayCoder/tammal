/**
 * Limit Resolver + CostGuard v3 — Unit Tests
 *
 * Tests plan-based limit resolution and cost guard integration.
 */
import { describe, it, expect } from "vitest";

// ── Inline resolution logic (mirrors limitResolver.ts) ──

type LimitsSource = "override" | "plan" | "none";

interface ResolvedLimits {
  monthly_token_limit: number | null;
  monthly_cost_limit: number | null;
  warning_threshold_percent: number;
  source: LimitsSource;
  plan_key: string | null;
}

interface OverrideRow {
  monthly_token_limit: number | null;
  monthly_cost_limit: number | null;
  warning_threshold_percent: number | null;
}

interface PlanRow {
  plan_key: string;
  monthly_token_limit: number | null;
  monthly_cost_limit: number | null;
  warning_threshold_percent: number | null;
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

function resolveFromData(
  override: OverrideRow | null,
  tenantPlanKey: string | null,
  planLimits: PlanRow | null,
): ResolvedLimits {
  // 1. Override wins
  if (override) {
    return {
      monthly_token_limit: validLimit(override.monthly_token_limit),
      monthly_cost_limit: validLimit(override.monthly_cost_limit),
      warning_threshold_percent: validThreshold(override.warning_threshold_percent),
      source: "override",
      plan_key: null,
    };
  }

  // 2. Plan-based
  if (tenantPlanKey && planLimits) {
    return {
      monthly_token_limit: validLimit(planLimits.monthly_token_limit),
      monthly_cost_limit: validLimit(planLimits.monthly_cost_limit),
      warning_threshold_percent: validThreshold(planLimits.warning_threshold_percent),
      source: "plan",
      plan_key: tenantPlanKey,
    };
  }

  // 3. None
  return {
    monthly_token_limit: null,
    monthly_cost_limit: null,
    warning_threshold_percent: DEFAULT_THRESHOLD,
    source: "none",
    plan_key: null,
  };
}

// ── Inline CostGuard computation (mirrors costGuard.ts v3) ──

interface CostCheckResult {
  allowed: boolean;
  tokenPercent: number;
  costPercent: number;
  warningTriggered: boolean;
  warningLimitType: string | null;
  blocked: boolean;
  blockedLimitType: string | null;
  threshold: number;
  limits_source: LimitsSource;
  plan_key: string | null;
}

function computeCostCheck(
  resolved: ResolvedLimits,
  usageRows: { tokens_used: number }[],
): CostCheckResult {
  const result: CostCheckResult = {
    allowed: true,
    tokenPercent: 0,
    costPercent: 0,
    warningTriggered: false,
    warningLimitType: null,
    blocked: false,
    blockedLimitType: null,
    threshold: resolved.warning_threshold_percent,
    limits_source: resolved.source,
    plan_key: resolved.plan_key,
  };

  if (resolved.source === "none") return result;

  const tokenLimit = resolved.monthly_token_limit;
  const costLimit = resolved.monthly_cost_limit;
  if (tokenLimit === null && costLimit === null) return result;

  const totalTokens = usageRows.reduce((s, r) => s + (r.tokens_used || 0), 0);
  const estimatedCost = (totalTokens / 1000) * 0.001;

  result.tokenPercent = tokenLimit !== null && tokenLimit > 0 ? (totalTokens / tokenLimit) * 100 : 0;
  result.costPercent = costLimit !== null && costLimit > 0 ? (estimatedCost / costLimit) * 100 : 0;

  if (result.tokenPercent >= 100) {
    result.allowed = false;
    result.blocked = true;
    result.blockedLimitType = "token";
    return result;
  }
  if (result.costPercent >= 100) {
    result.allowed = false;
    result.blocked = true;
    result.blockedLimitType = "cost";
    return result;
  }

  const wt = resolved.warning_threshold_percent;
  if (result.tokenPercent >= wt) {
    result.warningTriggered = true;
    result.warningLimitType = "token";
  }
  if (result.costPercent >= wt) {
    result.warningTriggered = true;
    result.warningLimitType = result.warningLimitType ? "both" : "cost";
  }

  return result;
}

// ── Tests ──

describe("Limit Resolver v1.0", () => {
  describe("resolution priority", () => {
    it("override wins over plan", () => {
      const result = resolveFromData(
        { monthly_token_limit: 50000, monthly_cost_limit: 5, warning_threshold_percent: 75 },
        "pro",
        { plan_key: "pro", monthly_token_limit: 1000000, monthly_cost_limit: 100, warning_threshold_percent: 85 },
      );
      expect(result.source).toBe("override");
      expect(result.monthly_token_limit).toBe(50000);
      expect(result.warning_threshold_percent).toBe(75);
      expect(result.plan_key).toBeNull();
    });

    it("plan used when override missing", () => {
      const result = resolveFromData(
        null,
        "starter",
        { plan_key: "starter", monthly_token_limit: 100000, monthly_cost_limit: 10, warning_threshold_percent: 80 },
      );
      expect(result.source).toBe("plan");
      expect(result.plan_key).toBe("starter");
      expect(result.monthly_token_limit).toBe(100000);
    });

    it("none when both missing", () => {
      const result = resolveFromData(null, null, null);
      expect(result.source).toBe("none");
      expect(result.monthly_token_limit).toBeNull();
      expect(result.monthly_cost_limit).toBeNull();
      expect(result.warning_threshold_percent).toBe(80);
    });

    it("plan used when override missing but plan exists", () => {
      const result = resolveFromData(
        null,
        "enterprise",
        { plan_key: "enterprise", monthly_token_limit: null, monthly_cost_limit: null, warning_threshold_percent: 90 },
      );
      expect(result.source).toBe("plan");
      expect(result.plan_key).toBe("enterprise");
      expect(result.monthly_token_limit).toBeNull(); // unlimited
      expect(result.warning_threshold_percent).toBe(90);
    });
  });

  describe("validation", () => {
    it("invalid threshold falls back to 80", () => {
      const r1 = resolveFromData(
        { monthly_token_limit: 100, monthly_cost_limit: 1, warning_threshold_percent: 0 },
        null, null,
      );
      expect(r1.warning_threshold_percent).toBe(80);

      const r2 = resolveFromData(
        { monthly_token_limit: 100, monthly_cost_limit: 1, warning_threshold_percent: 100 },
        null, null,
      );
      expect(r2.warning_threshold_percent).toBe(80);

      const r3 = resolveFromData(
        { monthly_token_limit: 100, monthly_cost_limit: 1, warning_threshold_percent: null },
        null, null,
      );
      expect(r3.warning_threshold_percent).toBe(80);
    });

    it("negative limits treated as null", () => {
      const result = resolveFromData(
        { monthly_token_limit: -500, monthly_cost_limit: -10, warning_threshold_percent: 80 },
        null, null,
      );
      expect(result.monthly_token_limit).toBeNull();
      expect(result.monthly_cost_limit).toBeNull();
    });

    it("NaN limits treated as null", () => {
      const result = resolveFromData(
        { monthly_token_limit: NaN as any, monthly_cost_limit: NaN as any, warning_threshold_percent: 80 },
        null, null,
      );
      expect(result.monthly_token_limit).toBeNull();
      expect(result.monthly_cost_limit).toBeNull();
    });
  });
});

describe("CostGuard v3 with resolved limits", () => {
  it("unlimited plan (enterprise) → no block, no warning", () => {
    const resolved: ResolvedLimits = {
      monthly_token_limit: null,
      monthly_cost_limit: null,
      warning_threshold_percent: 90,
      source: "plan",
      plan_key: "enterprise",
    };
    const result = computeCostCheck(resolved, [{ tokens_used: 999999 }]);
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.warningTriggered).toBe(false);
    expect(result.limits_source).toBe("plan");
    expect(result.plan_key).toBe("enterprise");
  });

  it("free plan at 85% → warning, not blocked", () => {
    const resolved: ResolvedLimits = {
      monthly_token_limit: 10000,
      monthly_cost_limit: 1,
      warning_threshold_percent: 80,
      source: "plan",
      plan_key: "free",
    };
    const result = computeCostCheck(resolved, [{ tokens_used: 8500 }]);
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.warningTriggered).toBe(true);
    expect(result.warningLimitType).toBe("token");
    expect(result.limits_source).toBe("plan");
  });

  it("override limits at 101% → blocked", () => {
    const resolved: ResolvedLimits = {
      monthly_token_limit: 50000,
      monthly_cost_limit: 5,
      warning_threshold_percent: 80,
      source: "override",
      plan_key: null,
    };
    const result = computeCostCheck(resolved, [{ tokens_used: 51000 }]);
    expect(result.allowed).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.blockedLimitType).toBe("token");
    expect(result.limits_source).toBe("override");
  });

  it("none source → unlimited, no checks", () => {
    const resolved: ResolvedLimits = {
      monthly_token_limit: null,
      monthly_cost_limit: null,
      warning_threshold_percent: 80,
      source: "none",
      plan_key: null,
    };
    const result = computeCostCheck(resolved, [{ tokens_used: 999999 }]);
    expect(result.allowed).toBe(true);
    expect(result.blocked).toBe(false);
    expect(result.limits_source).toBe("none");
  });

  it("telemetry fields populated correctly", () => {
    const resolved: ResolvedLimits = {
      monthly_token_limit: 100000,
      monthly_cost_limit: 10,
      warning_threshold_percent: 85,
      source: "plan",
      plan_key: "pro",
    };
    const result = computeCostCheck(resolved, [{ tokens_used: 50000 }]);
    expect(result.limits_source).toBe("plan");
    expect(result.plan_key).toBe("pro");
    expect(result.threshold).toBe(85);
    expect(result.tokenPercent).toBe(50);
    expect(result.warningTriggered).toBe(false);
  });

  it("plan threshold=85: 84% does NOT warn, 86% does", () => {
    const resolved: ResolvedLimits = {
      monthly_token_limit: 100000,
      monthly_cost_limit: 10,
      warning_threshold_percent: 85,
      source: "plan",
      plan_key: "pro",
    };
    const r1 = computeCostCheck(resolved, [{ tokens_used: 84000 }]);
    expect(r1.warningTriggered).toBe(false);

    const r2 = computeCostCheck(resolved, [{ tokens_used: 86000 }]);
    expect(r2.warningTriggered).toBe(true);
  });
});
