import { describe, it, expect } from 'vitest';
import { calculatePoints, computeStreak, computeTotalPoints } from '../gamificationService';

// ── Helper: build dates relative to today ──
function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ═══════════════════════════════════════
// calculatePoints
// ═══════════════════════════════════════
describe('calculatePoints', () => {
  it('returns base 10 when streak is 0', () => {
    expect(calculatePoints(0)).toBe(10);
  });

  it('returns 15 when streak is 1', () => {
    expect(calculatePoints(1)).toBe(15);
  });

  it('returns 35 when streak is 5', () => {
    expect(calculatePoints(5)).toBe(35);
  });

  it('caps bonus at 50 (streak = 10)', () => {
    expect(calculatePoints(10)).toBe(60);
  });

  it('caps bonus at 50 even for very high streaks', () => {
    expect(calculatePoints(100)).toBe(60);
    expect(calculatePoints(999)).toBe(60);
  });

  it('formula: 10 + min(streak * 5, 50)', () => {
    for (let s = 0; s <= 15; s++) {
      expect(calculatePoints(s)).toBe(10 + Math.min(s * 5, 50));
    }
  });
});

// ═══════════════════════════════════════
// computeStreak
// ═══════════════════════════════════════
describe('computeStreak', () => {
  it('returns 0 for empty array', () => {
    expect(computeStreak([])).toBe(0);
  });

  it('returns 0 for null/undefined', () => {
    expect(computeStreak(null as unknown as { entry_date: string }[])).toBe(0);
    expect(computeStreak(undefined as unknown as { entry_date: string }[])).toBe(0);
  });

  it('returns 1 for single entry today', () => {
    expect(computeStreak([{ entry_date: daysAgo(0) }])).toBe(1);
  });

  it('returns 0 for single entry 2 days ago (gap)', () => {
    expect(computeStreak([{ entry_date: daysAgo(2) }])).toBe(0);
  });

  it('returns 3 for consecutive 3 days ending today', () => {
    const entries = [
      { entry_date: daysAgo(0) },
      { entry_date: daysAgo(1) },
      { entry_date: daysAgo(2) },
    ];
    expect(computeStreak(entries)).toBe(3);
  });

  it('breaks streak at gap', () => {
    const entries = [
      { entry_date: daysAgo(0) },
      { entry_date: daysAgo(1) },
      // gap: daysAgo(2) missing
      { entry_date: daysAgo(3) },
    ];
    expect(computeStreak(entries)).toBe(2);
  });

  it('returns 0 if latest entry is yesterday (no today)', () => {
    // computeStreak expects DESC order; first entry checked against today
    const entries = [{ entry_date: daysAgo(1) }];
    expect(computeStreak(entries)).toBe(0);
  });

  it('handles entries already sorted DESC', () => {
    const entries = [
      { entry_date: daysAgo(0) },
      { entry_date: daysAgo(1) },
      { entry_date: daysAgo(2) },
      { entry_date: daysAgo(3) },
      { entry_date: daysAgo(4) },
    ];
    expect(computeStreak(entries)).toBe(5);
  });

  it('stops at gap even with many entries after', () => {
    const entries = [
      { entry_date: daysAgo(0) },
      { entry_date: daysAgo(2) }, // gap: day 1 missing
      { entry_date: daysAgo(3) },
      { entry_date: daysAgo(4) },
    ];
    expect(computeStreak(entries)).toBe(1);
  });
});

// ═══════════════════════════════════════
// computeTotalPoints
// ═══════════════════════════════════════
describe('computeTotalPoints', () => {
  it('returns 0 for empty array', () => {
    expect(computeTotalPoints([])).toBe(0);
  });

  it('sums points_earned values', () => {
    const entries = [
      { points_earned: 10 },
      { points_earned: 15 },
      { points_earned: 20 },
    ];
    expect(computeTotalPoints(entries)).toBe(45);
  });

  it('treats null points_earned as 0', () => {
    const entries = [
      { points_earned: 10 },
      { points_earned: null },
      { points_earned: 20 },
    ];
    expect(computeTotalPoints(entries)).toBe(30);
  });
});
