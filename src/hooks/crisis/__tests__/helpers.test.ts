import { describe, it, expect, vi } from 'vitest';
import { mapIntentToRisk, computeFirstAiderStatus } from '@/hooks/crisis/helpers';
import type { FirstAiderSchedule } from '@/hooks/crisis/types';

describe('crisis helpers', () => {
  it('maps intents to expected risk levels', () => {
    expect(mapIntentToRisk('self_harm')).toBe('high');
    expect(mapIntentToRisk('unsafe')).toBe('high');
    expect(mapIntentToRisk('talk')).toBe('low');
    expect(mapIntentToRisk('anxiety')).toBe('moderate');
  });

  it('returns offline when schedule missing or disabled', () => {
    expect(computeFirstAiderStatus(null)).toEqual({ statusLabel: 'offline', isAvailable: false });
    expect(computeFirstAiderStatus({ is_enabled: false } as FirstAiderSchedule)).toEqual({
      statusLabel: 'offline',
      isAvailable: false,
    });
  });

  it('returns temporarily_unavailable when flagged', () => {
    const schedule = { is_enabled: true, temp_unavailable: true } as FirstAiderSchedule;
    expect(computeFirstAiderStatus(schedule)).toEqual({
      statusLabel: 'temporarily_unavailable',
      isAvailable: false,
    });
  });

  it('returns outside_hours when no day rules match', () => {
    const schedule = {
      is_enabled: true,
      temp_unavailable: false,
      timezone: 'Asia/Riyadh',
      weekly_rules: {},
    } as unknown as FirstAiderSchedule;
    expect(computeFirstAiderStatus(schedule)).toEqual({ statusLabel: 'outside_hours', isAvailable: false });
  });
});