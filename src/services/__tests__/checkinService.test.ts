import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase before importing service ──
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInvoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'mood_entries') {
        return {
          insert: mockInsert,
          select: () => ({ eq: mockEq }),
        };
      }
      if (table === 'points_transactions') {
        return { insert: mockInsert };
      }
      return { insert: mockInsert, select: mockSelect };
    }),
    functions: { invoke: mockInvoke },
  },
}));

import { submitMoodEntry, fetchTodayEntry, type CheckinParams } from '../checkinService';

function makeParams(overrides: Partial<CheckinParams> = {}): CheckinParams {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    userId: 'user-1',
    moodLevel: 'good',
    moodScore: 4,
    currentStreak: 0,
    entryDate: '2025-01-15',
    language: 'en',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: tip generation returns a tip
  mockInvoke.mockResolvedValue({ data: { tip: 'Stay positive!' } });
  // Default: mood insert succeeds
  mockInsert.mockResolvedValue({ error: null });
});

describe('submitMoodEntry', () => {
  it('returns correct structure on success (streak=0)', async () => {
    const result = await submitMoodEntry(makeParams({ currentStreak: 0 }));

    expect(result.alreadySubmitted).toBe(false);
    expect(result.pointsEarned).toBe(10); // 10 + min(0*5, 50)
    expect(result.newStreak).toBe(1);
    expect(result.tip).toBe('Stay positive!');
  });

  it('calculates points correctly for streak=5', async () => {
    const result = await submitMoodEntry(makeParams({ currentStreak: 5 }));

    expect(result.pointsEarned).toBe(35); // 10 + min(25, 50)
    expect(result.newStreak).toBe(6);
  });

  it('handles idempotency — unique violation returns alreadySubmitted', async () => {
    // First insert (mood_entries) returns unique violation
    mockInsert.mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } });

    const result = await submitMoodEntry(makeParams());

    expect(result.alreadySubmitted).toBe(true);
    expect(result.pointsEarned).toBe(0);
    expect(result.newStreak).toBe(0); // stays at currentStreak
  });

  it('throws on non-unique DB error during mood insert', async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: '42000', message: 'some DB error' } });

    await expect(submitMoodEntry(makeParams())).rejects.toEqual(
      expect.objectContaining({ code: '42000' })
    );
  });

  it('does not throw if points ledger insert fails (logs warning)', async () => {
    // First call (mood_entries) succeeds, second (points_transactions) fails
    mockInsert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { code: '42000', message: 'points fail' } });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await submitMoodEntry(makeParams());

    expect(result.alreadySubmitted).toBe(false);
    expect(result.pointsEarned).toBe(10);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Points ledger insert failed:',
      'points fail'
    );

    consoleSpy.mockRestore();
  });

  it('returns empty tip if AI tip generation fails', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('AI down'));

    const result = await submitMoodEntry(makeParams());

    expect(result.tip).toBe('');
    expect(result.alreadySubmitted).toBe(false);
  });
});
