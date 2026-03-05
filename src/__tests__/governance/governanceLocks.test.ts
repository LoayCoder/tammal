import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for the enforce_action_lock trigger contract.
 */

const FROZEN_FIELDS = [
  'title', 'title_ar', 'description', 'assignee_id',
  'priority', 'estimated_hours', 'planned_start', 'planned_end',
] as const;

const ALLOWED_FIELDS = ['status', 'notes', 'actual_hours', 'progress', 'sla_status'] as const;

interface ActionRecord {
  is_locked: boolean;
  [key: string]: unknown;
}

function validateLockEnforcement(
  old: ActionRecord,
  updated: ActionRecord,
  changedFields: string[]
): { allowed: boolean; reason?: string } {
  // If not locked, all changes allowed
  if (!old.is_locked) return { allowed: true };

  // If unlocking, allow
  if (old.is_locked && !updated.is_locked) return { allowed: true };

  // Check frozen fields
  const frozenChanges = changedFields.filter(f => (FROZEN_FIELDS as readonly string[]).includes(f));
  if (frozenChanges.length > 0) {
    return {
      allowed: false,
      reason: `Entity is locked. Frozen fields (${frozenChanges.join(', ')}) cannot be modified.`,
    };
  }

  return { allowed: true };
}

describe('Governance Lock Enforcement', () => {
  it('rejects frozen field changes when locked', () => {
    const old: ActionRecord = { is_locked: true, title: 'Old' };
    const updated: ActionRecord = { is_locked: true, title: 'New' };
    const result = validateLockEnforcement(old, updated, ['title']);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('title');
  });

  it('rejects multiple frozen field changes when locked', () => {
    const old: ActionRecord = { is_locked: true };
    const updated: ActionRecord = { is_locked: true };
    const result = validateLockEnforcement(old, updated, ['title', 'priority', 'assignee_id']);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('title');
    expect(result.reason).toContain('priority');
  });

  it('allows status/notes changes when locked', () => {
    const old: ActionRecord = { is_locked: true };
    const updated: ActionRecord = { is_locked: true };
    const result = validateLockEnforcement(old, updated, ['status', 'notes']);
    expect(result.allowed).toBe(true);
  });

  it('allows all changes when unlocked', () => {
    const old: ActionRecord = { is_locked: false };
    const updated: ActionRecord = { is_locked: false };
    const result = validateLockEnforcement(old, updated, ['title', 'priority', 'assignee_id']);
    expect(result.allowed).toBe(true);
  });

  it('allows unlock operation even with frozen field changes', () => {
    const old: ActionRecord = { is_locked: true };
    const updated: ActionRecord = { is_locked: false };
    const result = validateLockEnforcement(old, updated, ['is_locked', 'title']);
    expect(result.allowed).toBe(true);
  });

  it('each frozen field is individually protected', () => {
    for (const field of FROZEN_FIELDS) {
      const result = validateLockEnforcement(
        { is_locked: true },
        { is_locked: true },
        [field]
      );
      expect(result.allowed).toBe(false);
    }
  });

  it('each allowed field passes when locked', () => {
    for (const field of ALLOWED_FIELDS) {
      const result = validateLockEnforcement(
        { is_locked: true },
        { is_locked: true },
        [field]
      );
      expect(result.allowed).toBe(true);
    }
  });
});
