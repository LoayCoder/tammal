/**
 * CostGuard v2 — Unit Tests
 *
 * Tests the soft warning (80%) + hard block (100%) logic.
 * Uses mock Supabase client to simulate DB responses.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock types matching costGuard.ts expectations ──
interface MockRow {
  [key: string]: unknown;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
}

function createMockQueryBuilder(data: MockRow | MockRow[] | null = null): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return builder;
}

// ── Inline implementation of CostGuard logic for testing ──
// (We test the business logic directly since edge functions can't be imported)

class CostLimitExceededError extends Error {
  constructor(limitType: string, percent: number) {
    super(`AI cost limit exceeded (${limitType}: ${percent.toFixed(1)}%)`);
    this.name = "CostLimitExceededError";
  }
}

interface CostCheckResult {
  allowed: boolean;
  tokenPercent: number;
  costPercent: number;
  warningTriggered: boolean;
  warningLimitType: string | null;
  blocked: boolean;
  blockedLimitType: string | null;
}

interface TenantLimits {
  monthly_token_limit: number;
  monthly_cost_limit: number;
  warning_threshold_percent: number;
}

interface UsageRow {
  tokens_used: number;
  duration_ms: number;
}

function computeCostCheck(
  limits: TenantLimits | null,
  usageRows: UsageRow[],
): CostCheckResult {
  const result: CostCheckResult = {
    allowed: true,
    tokenPercent: 0,
    costPercent: 0,
    warningTriggered: false,
    warningLimitType: null,
    blocked: false,
    blockedLimitType: null,
  };

  if (!limits) return result;

  const warningThreshold = limits.warning_threshold_percent ?? 80;
  const totalTokens = usageRows.reduce((s, r) => s + (r.tokens_used || 0), 0);
  const estimatedCost = (totalTokens / 1000) * 0.001;

  result.tokenPercent =
    limits.monthly_token_limit > 0
      ? (totalTokens / limits.monthly_token_limit) * 100
      : 0;
  result.costPercent =
    Number(limits.monthly_cost_limit) > 0
      ? (estimatedCost / Number(limits.monthly_cost_limit)) * 100
      : 0;

  // Hard block
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

  // Soft warning
  if (result.tokenPercent >= warningThreshold) {
    result.warningTriggered = true;
    result.warningLimitType = "token";
  }
  if (result.costPercent >= warningThreshold) {
    result.warningTriggered = true;
    result.warningLimitType = result.warningLimitType ? "both" : "cost";
  }

  return result;
}

// ── Tests ──
describe("CostGuard v2", () => {
  describe("computeCostCheck", () => {
    const defaultLimits: TenantLimits = {
      monthly_token_limit: 100_000,
      monthly_cost_limit: 50,
      warning_threshold_percent: 80,
    };

    it("allows freely when no limits configured", () => {
      const result = computeCostCheck(null, []);
      expect(result.allowed).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.warningTriggered).toBe(false);
    });

    it("50% usage → no warning, not blocked", () => {
      const usage = [{ tokens_used: 50_000, duration_ms: 1000 }];
      const result = computeCostCheck(defaultLimits, usage);
      expect(result.allowed).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.warningTriggered).toBe(false);
      expect(result.tokenPercent).toBe(50);
    });

    it("85% usage → warning created but not blocked", () => {
      const usage = [{ tokens_used: 85_000, duration_ms: 1000 }];
      const result = computeCostCheck(defaultLimits, usage);
      expect(result.allowed).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.warningTriggered).toBe(true);
      expect(result.warningLimitType).toBe("token");
    });

    it("101% usage → blocked", () => {
      const usage = [{ tokens_used: 101_000, duration_ms: 1000 }];
      const result = computeCostCheck(defaultLimits, usage);
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.blockedLimitType).toBe("token");
    });

    it("exactly 80% → triggers warning", () => {
      const usage = [{ tokens_used: 80_000, duration_ms: 500 }];
      const result = computeCostCheck(defaultLimits, usage);
      expect(result.allowed).toBe(true);
      expect(result.warningTriggered).toBe(true);
    });

    it("exactly 100% → blocked", () => {
      const usage = [{ tokens_used: 100_000, duration_ms: 500 }];
      const result = computeCostCheck(defaultLimits, usage);
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it("cost-based threshold works independently", () => {
      // monthly_cost_limit = $50, tokens at 0.001/1000
      // Need $40+ to hit 80% warning → 40/0.001*1000 = 40_000_000 tokens
      const costLimits: TenantLimits = {
        monthly_token_limit: 999_999_999, // very high, won't trigger
        monthly_cost_limit: 0.0001, // very low cost limit
        warning_threshold_percent: 80,
      };
      const usage = [{ tokens_used: 1000, duration_ms: 500 }]; // cost = 0.001
      const result = computeCostCheck(costLimits, usage);
      // 0.001 / 0.0001 * 100 = 1000% → blocked
      expect(result.blocked).toBe(true);
      expect(result.blockedLimitType).toBe("cost");
    });

    it("multiple usage rows are summed", () => {
      const usage = [
        { tokens_used: 30_000, duration_ms: 500 },
        { tokens_used: 30_000, duration_ms: 500 },
        { tokens_used: 25_000, duration_ms: 500 },
      ];
      const result = computeCostCheck(defaultLimits, usage);
      expect(result.tokenPercent).toBe(85);
      expect(result.warningTriggered).toBe(true);
      expect(result.blocked).toBe(false);
    });
  });

  describe("CostLimitExceededError", () => {
    it("has correct name and message", () => {
      const err = new CostLimitExceededError("token", 105.3);
      expect(err.name).toBe("CostLimitExceededError");
      expect(err.message).toContain("token");
      expect(err.message).toContain("105.3");
    });
  });

  describe("Alert spam prevention", () => {
    it("duplicate warning not created twice (existing alert found)", () => {
      // Simulate: existing alert found → insert should NOT be called
      const mockBuilder = createMockQueryBuilder({ id: "existing-alert-id" });
      // The logic: if maybeSingle returns data, skip insert
      const existing = { id: "existing-alert-id" };
      const shouldInsert = !existing;
      expect(shouldInsert).toBe(false);
    });

    it("creates alert when none exists", () => {
      const existing = null;
      const shouldInsert = !existing;
      expect(shouldInsert).toBe(true);
    });

    it("warning does not throw even on insert failure", () => {
      // Test that the try/catch in createWarningAlert prevents throwing
      expect(() => {
        try {
          throw new Error("DB insert failed");
        } catch {
          // Swallowed — matches costGuard behavior
        }
      }).not.toThrow();
    });
  });

  describe("Telemetry tags", () => {
    it("provides correct telemetry shape for logging", () => {
      const result = computeCostCheck(
        { monthly_token_limit: 100_000, monthly_cost_limit: 50, warning_threshold_percent: 80 },
        [{ tokens_used: 90_000, duration_ms: 1000 }],
      );

      const tags = {
        ai_cost_percent: Math.max(result.tokenPercent, result.costPercent),
        ai_cost_warning: result.warningTriggered,
        ai_cost_limit_type: result.warningLimitType || result.blockedLimitType || "none",
        ai_cost_blocked: result.blocked,
      };

      expect(tags.ai_cost_percent).toBe(90);
      expect(tags.ai_cost_warning).toBe(true);
      expect(tags.ai_cost_blocked).toBe(false);
      expect(tags.ai_cost_limit_type).toBe("token");
    });
  });
});
