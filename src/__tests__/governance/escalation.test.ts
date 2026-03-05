import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for escalation threshold classification.
 */

interface EscalationResult {
  level: number;
  label: string;
}

function determineEscalationLevel(daysOverdue: number): EscalationResult | null {
  if (daysOverdue < 3) return null;
  if (daysOverdue >= 14) return { level: 3, label: 'executive' };
  if (daysOverdue >= 7) return { level: 2, label: 'department_head' };
  return { level: 1, label: 'manager' };
}

function shouldEscalate(
  daysOverdue: number,
  existingEscalationLevels: number[]
): EscalationResult | null {
  const result = determineEscalationLevel(daysOverdue);
  if (!result) return null;
  // No duplicate escalation for same level
  if (existingEscalationLevels.includes(result.level)) return null;
  return result;
}

describe('Escalation Thresholds', () => {
  it('returns null for tasks not overdue', () => {
    expect(determineEscalationLevel(0)).toBeNull();
    expect(determineEscalationLevel(2)).toBeNull();
  });

  it('triggers L1 (manager) at 3 days overdue', () => {
    const result = determineEscalationLevel(3);
    expect(result?.level).toBe(1);
    expect(result?.label).toBe('manager');
  });

  it('triggers L2 (department head) at 7 days overdue', () => {
    const result = determineEscalationLevel(7);
    expect(result?.level).toBe(2);
    expect(result?.label).toBe('department_head');
  });

  it('triggers L3 (executive) at 14 days overdue', () => {
    const result = determineEscalationLevel(14);
    expect(result?.level).toBe(3);
    expect(result?.label).toBe('executive');
  });

  it('L3 applies for days > 14', () => {
    const result = determineEscalationLevel(30);
    expect(result?.level).toBe(3);
  });

  it('prevents duplicate escalation for same level', () => {
    expect(shouldEscalate(5, [1])).toBeNull(); // L1 already exists
    expect(shouldEscalate(10, [1, 2])).toBeNull(); // L2 already exists
  });

  it('allows escalation when level not yet triggered', () => {
    expect(shouldEscalate(5, [])).toEqual({ level: 1, label: 'manager' });
    expect(shouldEscalate(10, [1])).toEqual({ level: 2, label: 'department_head' });
    expect(shouldEscalate(20, [1, 2])).toEqual({ level: 3, label: 'executive' });
  });
});
