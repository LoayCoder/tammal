import type { FirstAiderSchedule } from './types';

export function mapIntentToRisk(intent: string): string {
  const high = ['self_harm', 'unsafe'];
  const low = ['talk'];
  if (high.includes(intent)) return 'high';
  if (low.includes(intent)) return 'low';
  return 'moderate';
}

export function computeFirstAiderStatus(
  schedule: FirstAiderSchedule | null,
): { statusLabel: string; isAvailable: boolean } {
  if (!schedule || !schedule.is_enabled) return { statusLabel: 'offline', isAvailable: false };
  if (schedule.temp_unavailable) return { statusLabel: 'temporarily_unavailable', isAvailable: false };

  const tz = schedule.timezone || 'Asia/Riyadh';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase()?.slice(0, 3) || '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const rules = schedule.weekly_rules?.[weekday] || [];
  const nowMinutes = hour * 60 + minute;

  for (const slot of rules) {
    const [fh, fm] = slot.from.split(':').map(Number);
    const [th, tm] = slot.to.split(':').map(Number);
    if (nowMinutes >= fh * 60 + fm && nowMinutes <= th * 60 + tm) {
      return { statusLabel: 'available', isAvailable: true };
    }
  }

  return { statusLabel: 'outside_hours', isAvailable: false };
}
