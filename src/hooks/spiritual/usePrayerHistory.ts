import { useMemo, useState } from 'react';
import { usePrayerLogs, type PrayerLog } from './usePrayerLogs';
import { useSunnahHistoryLogs, type SunnahHistoryLog } from './useSunnahHistoryLogs';

export type HistoryRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'] as const;

const RAWATIB_CONFIG: Record<string, { before: number; after: number }> = {
  Fajr: { before: 2, after: 0 },
  Dhuhr: { before: 2, after: 2 },
  Asr: { before: 0, after: 0 },
  Maghrib: { before: 0, after: 2 },
  Isha: { before: 0, after: 2 },
};

function getDateRange(range: HistoryRange, customFrom?: string, customTo?: string) {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  let from = to;

  switch (range) {
    case 'week':
      from = offsetDate(today, -6);
      break;
    case 'month':
      from = offsetDate(today, -29);
      break;
    case 'quarter':
      from = offsetDate(today, -89);
      break;
    case 'year':
      from = offsetDate(today, -364);
      break;
    case 'custom':
      from = customFrom ?? offsetDate(today, -6);
      return { from, to: customTo ?? to };
  }
  return { from, to };
}

function offsetDate(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const current = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  while (current <= end) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export interface DailyData {
  date: string;
  completed: number;
  total: number;
  pct: number;
  rawatibCompleted: number;
  rawatibTotal: number;
  rawatibPct: number;
}

export interface PrayerStat {
  prayerName: string;
  completed: number;
  total: number;
  pct: number;
}

export interface RawatibStat {
  prayerName: string;
  beforeCompleted: number;
  afterCompleted: number;
  beforeTotal: number;
  afterTotal: number;
  beforePct: number;
  afterPct: number;
}

export function usePrayerHistory() {
  const [range, setRange] = useState<HistoryRange>('week');
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();

  const { from, to } = useMemo(
    () => getDateRange(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  const { logs, isPending: prayerPending } = usePrayerLogs({ from, to });
  const { logs: sunnahLogs, isPending: sunnahPending } = useSunnahHistoryLogs({ from, to });

  const isPending = prayerPending || sunnahPending;

  // Total rawatib slots per day (Fajr:1 + Dhuhr:2 + Maghrib:1 + Isha:1 = 5 slots)
  const DAILY_RAWATIB_TOTAL = Object.values(RAWATIB_CONFIG).reduce(
    (sum, c) => sum + (c.before > 0 ? 1 : 0) + (c.after > 0 ? 1 : 0),
    0
  );

  const { dailyData, prayerStats, rawatibStats, currentStreak, bestStreak } = useMemo(() => {
    const days = eachDay(from, to);

    // Prayer logs by date
    const logsByDate = new Map<string, PrayerLog[]>();
    for (const log of logs) {
      const list = logsByDate.get(log.prayer_date) ?? [];
      list.push(log);
      logsByDate.set(log.prayer_date, list);
    }

    // Sunnah logs by date
    const sunnahByDate = new Map<string, SunnahHistoryLog[]>();
    for (const log of sunnahLogs) {
      const list = sunnahByDate.get(log.log_date) ?? [];
      list.push(log);
      sunnahByDate.set(log.log_date, list);
    }

    const dailyData: DailyData[] = days.map((date) => {
      const dayLogs = logsByDate.get(date) ?? [];
      const completed = dayLogs.filter((l) => l.status.startsWith('completed')).length;
      const daySunnah = sunnahByDate.get(date) ?? [];
      const rawatibCompleted = daySunnah.length;
      return {
        date,
        completed,
        total: 6,
        pct: Math.round((completed / 6) * 100),
        rawatibCompleted,
        rawatibTotal: DAILY_RAWATIB_TOTAL,
        rawatibPct: DAILY_RAWATIB_TOTAL > 0 ? Math.round((rawatibCompleted / DAILY_RAWATIB_TOTAL) * 100) : 0,
      };
    });

    // Per-prayer stats
    const prayerStats: PrayerStat[] = PRAYER_NAMES.map((name) => {
      const matching = logs.filter((l) => l.prayer_name === name);
      const completed = matching.filter((l) => l.status.startsWith('completed')).length;
      const total = days.length;
      return { prayerName: name, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
    });

    // Per-prayer Rawatib stats
    const rawatibStats: RawatibStat[] = Object.entries(RAWATIB_CONFIG)
      .filter(([, cfg]) => cfg.before > 0 || cfg.after > 0)
      .map(([prayerName, cfg]) => {
        const beforeKey = `rawatib_${prayerName.toLowerCase()}_before`;
        const afterKey = `rawatib_${prayerName.toLowerCase()}_after`;
        const beforeCompleted = sunnahLogs.filter((l) => l.practice_type === beforeKey).length;
        const afterCompleted = sunnahLogs.filter((l) => l.practice_type === afterKey).length;
        const beforeTotal = cfg.before > 0 ? days.length : 0;
        const afterTotal = cfg.after > 0 ? days.length : 0;
        return {
          prayerName,
          beforeCompleted,
          afterCompleted,
          beforeTotal,
          afterTotal,
          beforePct: beforeTotal > 0 ? Math.round((beforeCompleted / beforeTotal) * 100) : 0,
          afterPct: afterTotal > 0 ? Math.round((afterCompleted / afterTotal) * 100) : 0,
        };
      });

    // Streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 0;
    for (let i = dailyData.length - 1; i >= 0; i--) {
      if (dailyData[i].completed >= 5) {
        streak++;
        if (i === dailyData.length - 1 || currentStreak > 0) currentStreak = streak;
      } else {
        if (streak > bestStreak) bestStreak = streak;
        streak = 0;
        if (currentStreak === 0) currentStreak = 0;
      }
    }
    if (streak > bestStreak) bestStreak = streak;
    if (currentStreak === 0) {
      for (let i = dailyData.length - 1; i >= 0; i--) {
        if (dailyData[i].completed >= 5) currentStreak++;
        else break;
      }
    }

    return { dailyData, prayerStats, rawatibStats, currentStreak, bestStreak };
  }, [logs, sunnahLogs, from, to, DAILY_RAWATIB_TOTAL]);

  return {
    range, setRange,
    customFrom, customTo, setCustomFrom, setCustomTo,
    from, to,
    dailyData, prayerStats, rawatibStats,
    currentStreak, bestStreak,
    isPending,
  };
}
