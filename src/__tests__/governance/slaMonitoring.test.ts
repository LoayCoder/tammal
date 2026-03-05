import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for SLA classification thresholds.
 */

type SlaStatus = 'within_sla' | 'approaching_breach' | 'breached';

interface SlaInput {
  sla_minutes: number | null;
  elapsed_minutes: number;
}

function classifySla(input: SlaInput): SlaStatus | null {
  if (input.sla_minutes === null || input.sla_minutes <= 0) return null;
  const pct = (input.elapsed_minutes / input.sla_minutes) * 100;
  if (pct >= 100) return 'breached';
  if (pct >= 80) return 'approaching_breach';
  return 'within_sla';
}

describe('SLA Monitoring Classification', () => {
  it('classifies as within_sla when <80% elapsed', () => {
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 50 })).toBe('within_sla');
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 79 })).toBe('within_sla');
  });

  it('classifies as approaching_breach at 80-99%', () => {
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 80 })).toBe('approaching_breach');
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 99 })).toBe('approaching_breach');
  });

  it('classifies as breached at 100%+', () => {
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 100 })).toBe('breached');
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 200 })).toBe('breached');
  });

  it('returns null when sla_minutes is null', () => {
    expect(classifySla({ sla_minutes: null, elapsed_minutes: 50 })).toBeNull();
  });

  it('returns null when sla_minutes is 0', () => {
    expect(classifySla({ sla_minutes: 0, elapsed_minutes: 50 })).toBeNull();
  });

  it('handles exactly 80% boundary', () => {
    expect(classifySla({ sla_minutes: 1000, elapsed_minutes: 800 })).toBe('approaching_breach');
  });

  it('handles 0 elapsed time', () => {
    expect(classifySla({ sla_minutes: 100, elapsed_minutes: 0 })).toBe('within_sla');
  });
});
