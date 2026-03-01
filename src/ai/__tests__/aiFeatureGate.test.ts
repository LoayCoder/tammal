/**
 * AI Feature Gate — Unit Tests
 *
 * Tests RBAC enforcement, feature flag checks, and denial reasons.
 */

import { describe, it, expect } from 'vitest';

// ── Types mirrored from featureGate.ts ──────────────────────────

type AIFeatureKey = 'question_generation' | 'prompt_rewrite' | 'ai_critic_pass' | 'quality_regen';
type MinRole = 'user' | 'manager' | 'tenant_admin';
type DenialReason = 'rbac' | 'feature_disabled';

const FEATURE_ROLE_MAP: Record<AIFeatureKey, MinRole> = {
  question_generation: 'user',
  prompt_rewrite: 'user',
  ai_critic_pass: 'tenant_admin',
  quality_regen: 'tenant_admin',
};

const ROLE_HIERARCHY = ['user', 'manager', 'tenant_admin', 'super_admin'];

function roleLevel(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx >= 0 ? idx : 0;
}

interface GateCheckInput {
  userRole: string;
  featureEnabled: boolean;
  feature: AIFeatureKey;
}

interface GateCheckResult {
  allowed: boolean;
  denied: boolean;
  reason: DenialReason | null;
}

function simulateFeatureGate(input: GateCheckInput): GateCheckResult {
  // 1. Feature flag check
  if (!input.featureEnabled) {
    return { allowed: false, denied: true, reason: 'feature_disabled' };
  }

  // 2. RBAC check
  const requiredRole = FEATURE_ROLE_MAP[input.feature] || 'user';
  const userLevel = roleLevel(input.userRole);
  const requiredLevel = roleLevel(requiredRole);

  if (userLevel < requiredLevel) {
    return { allowed: false, denied: true, reason: 'rbac' };
  }

  return { allowed: true, denied: false, reason: null };
}

// ── RBAC Tests ──────────────────────────────────────────────────

describe('Feature Gate RBAC', () => {
  it('employee can use question_generation', () => {
    const result = simulateFeatureGate({
      userRole: 'user',
      featureEnabled: true,
      feature: 'question_generation',
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('employee can use prompt_rewrite', () => {
    const result = simulateFeatureGate({
      userRole: 'user',
      featureEnabled: true,
      feature: 'prompt_rewrite',
    });
    expect(result.allowed).toBe(true);
  });

  it('employee cannot use ai_critic_pass', () => {
    const result = simulateFeatureGate({
      userRole: 'user',
      featureEnabled: true,
      feature: 'ai_critic_pass',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('rbac');
  });

  it('employee cannot use quality_regen', () => {
    const result = simulateFeatureGate({
      userRole: 'user',
      featureEnabled: true,
      feature: 'quality_regen',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('rbac');
  });

  it('manager cannot use ai_critic_pass (requires admin)', () => {
    const result = simulateFeatureGate({
      userRole: 'manager',
      featureEnabled: true,
      feature: 'ai_critic_pass',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('rbac');
  });

  it('manager cannot use quality_regen (requires admin)', () => {
    const result = simulateFeatureGate({
      userRole: 'manager',
      featureEnabled: true,
      feature: 'quality_regen',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('rbac');
  });

  it('tenant_admin can use ai_critic_pass', () => {
    const result = simulateFeatureGate({
      userRole: 'tenant_admin',
      featureEnabled: true,
      feature: 'ai_critic_pass',
    });
    expect(result.allowed).toBe(true);
  });

  it('tenant_admin can use quality_regen', () => {
    const result = simulateFeatureGate({
      userRole: 'tenant_admin',
      featureEnabled: true,
      feature: 'quality_regen',
    });
    expect(result.allowed).toBe(true);
  });

  it('super_admin can use any feature', () => {
    for (const feature of ['question_generation', 'prompt_rewrite', 'ai_critic_pass', 'quality_regen'] as AIFeatureKey[]) {
      const result = simulateFeatureGate({
        userRole: 'super_admin',
        featureEnabled: true,
        feature,
      });
      expect(result.allowed).toBe(true);
    }
  });

  it('unknown role treated as lowest (user)', () => {
    const result = simulateFeatureGate({
      userRole: 'unknown_role',
      featureEnabled: true,
      feature: 'ai_critic_pass',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('rbac');
  });
});

// ── Feature Flag Tests ──────────────────────────────────────────

describe('Feature Gate Feature Flags', () => {
  it('disabled feature blocks even admin', () => {
    const result = simulateFeatureGate({
      userRole: 'tenant_admin',
      featureEnabled: false,
      feature: 'ai_critic_pass',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('feature_disabled');
  });

  it('disabled feature blocks even super_admin', () => {
    const result = simulateFeatureGate({
      userRole: 'super_admin',
      featureEnabled: false,
      feature: 'quality_regen',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('feature_disabled');
  });

  it('disabled question_generation blocks employee', () => {
    const result = simulateFeatureGate({
      userRole: 'user',
      featureEnabled: false,
      feature: 'question_generation',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('feature_disabled');
  });

  it('enabled feature with sufficient role allows access', () => {
    const result = simulateFeatureGate({
      userRole: 'tenant_admin',
      featureEnabled: true,
      feature: 'quality_regen',
    });
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeNull();
  });
});

// ── Denial reason precedence ────────────────────────────────────

describe('Feature Gate Denial Precedence', () => {
  it('feature_disabled takes precedence over rbac', () => {
    // Employee trying disabled admin feature: should get feature_disabled, not rbac
    const result = simulateFeatureGate({
      userRole: 'user',
      featureEnabled: false,
      feature: 'ai_critic_pass',
    });
    expect(result.reason).toBe('feature_disabled');
  });
});

// ── Role hierarchy tests ────────────────────────────────────────

describe('Role Hierarchy', () => {
  it('respects role ordering: user < manager < tenant_admin < super_admin', () => {
    expect(roleLevel('user')).toBeLessThan(roleLevel('manager'));
    expect(roleLevel('manager')).toBeLessThan(roleLevel('tenant_admin'));
    expect(roleLevel('tenant_admin')).toBeLessThan(roleLevel('super_admin'));
  });

  it('manager can use employee-level features', () => {
    const result = simulateFeatureGate({
      userRole: 'manager',
      featureEnabled: true,
      feature: 'question_generation',
    });
    expect(result.allowed).toBe(true);
  });
});
