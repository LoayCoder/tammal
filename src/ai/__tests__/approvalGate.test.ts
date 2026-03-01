import { describe, it, expect } from "vitest";
import {
  detectHighRisk,
  detectPostExecutionHighRisk,
  isAdminRole,
  hashPayload,
  HIGH_RISK_QUESTION_COUNT,
  HIGH_RISK_TRIM_PERCENT,
} from "./approvalGate.testHelpers";

// ── detectHighRisk ──────────────────────────────────────────────

describe("detectHighRisk", () => {
  it("returns not high-risk for normal request", () => {
    const result = detectHighRisk({
      questionCount: 10,
      enableCriticPass: false,
    });
    expect(result.isHighRisk).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("flags questionCount > 25", () => {
    const result = detectHighRisk({
      questionCount: 30,
      enableCriticPass: false,
    });
    expect(result.isHighRisk).toBe(true);
    expect(result.reasons).toContain("question_count_30");
  });

  it("flags exactly at boundary (26)", () => {
    const result = detectHighRisk({
      questionCount: 26,
      enableCriticPass: false,
    });
    expect(result.isHighRisk).toBe(true);
  });

  it("does NOT flag at boundary (25)", () => {
    const result = detectHighRisk({
      questionCount: 25,
      enableCriticPass: false,
    });
    expect(result.isHighRisk).toBe(false);
  });

  it("flags enableCriticPass", () => {
    const result = detectHighRisk({
      questionCount: 5,
      enableCriticPass: true,
    });
    expect(result.isHighRisk).toBe(true);
    expect(result.reasons).toContain("critic_pass_enabled");
  });

  it("flags context trim > 25%", () => {
    const result = detectHighRisk({
      questionCount: 5,
      enableCriticPass: false,
      contextTrimPercent: 0.30,
    });
    expect(result.isHighRisk).toBe(true);
    expect(result.reasons[0]).toMatch(/context_trimmed_30pct/);
  });

  it("does NOT flag context trim at 25%", () => {
    const result = detectHighRisk({
      questionCount: 5,
      enableCriticPass: false,
      contextTrimPercent: 0.25,
    });
    expect(result.isHighRisk).toBe(false);
  });

  it("accumulates multiple reasons", () => {
    const result = detectHighRisk({
      questionCount: 50,
      enableCriticPass: true,
      contextTrimPercent: 0.40,
    });
    expect(result.isHighRisk).toBe(true);
    expect(result.reasons).toHaveLength(3);
  });
});

// ── detectPostExecutionHighRisk ──────────────────────────────────

describe("detectPostExecutionHighRisk", () => {
  it("flags regen_full", () => {
    const result = detectPostExecutionHighRisk("regen_full");
    expect(result.isHighRisk).toBe(true);
    expect(result.reasons).toContain("batch_quality_regen_full");
  });

  it("does NOT flag accept", () => {
    expect(detectPostExecutionHighRisk("accept").isHighRisk).toBe(false);
  });

  it("does NOT flag regen_partial", () => {
    expect(detectPostExecutionHighRisk("regen_partial").isHighRisk).toBe(false);
  });
});

// ── isAdminRole ──────────────────────────────────────────────────

describe("isAdminRole", () => {
  it("returns true for tenant_admin", () => {
    expect(isAdminRole("tenant_admin")).toBe(true);
  });

  it("returns true for super_admin", () => {
    expect(isAdminRole("super_admin")).toBe(true);
  });

  it("returns false for user", () => {
    expect(isAdminRole("user")).toBe(false);
  });

  it("returns false for manager", () => {
    expect(isAdminRole("manager")).toBe(false);
  });
});

// ── hashPayload ──────────────────────────────────────────────────

describe("hashPayload", () => {
  it("returns deterministic hash", () => {
    const payload = { a: 1, b: "test" };
    const h1 = hashPayload(payload);
    const h2 = hashPayload(payload);
    expect(h1).toBe(h2);
  });

  it("returns same hash for different key order", () => {
    const h1 = hashPayload({ a: 1, b: 2 });
    const h2 = hashPayload({ b: 2, a: 1 });
    expect(h1).toBe(h2);
  });

  it("returns different hash for different payload", () => {
    const h1 = hashPayload({ a: 1 });
    const h2 = hashPayload({ a: 2 });
    expect(h1).not.toBe(h2);
  });

  it("returns a string", () => {
    expect(typeof hashPayload({ x: true })).toBe("string");
  });
});

// ── Constants ────────────────────────────────────────────────────

describe("constants", () => {
  it("HIGH_RISK_QUESTION_COUNT = 25", () => {
    expect(HIGH_RISK_QUESTION_COUNT).toBe(25);
  });

  it("HIGH_RISK_TRIM_PERCENT = 0.25", () => {
    expect(HIGH_RISK_TRIM_PERCENT).toBe(0.25);
  });
});
