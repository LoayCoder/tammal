import { useMemo, useState } from 'react';
import { usePrayerLogs, type PrayerLog } from './usePrayerLogs';

export type HistoryRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Witr'] as const;

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
}

export interface PrayerStat {
  prayerName: string;
  completed: number;
  total: number;
  pct: number;
}

export function usePrayerHistory() {
  const [range, setRange] = useState<HistoryRange>('week');
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();

  const { from, to } = useMemo(
    () => getDateRange(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  const { logs, isPending } = usePrayerLogs({ from, to });

  const { dailyData, prayerStats, currentStreak, bestStreak } = useMemo(() => {
    const days = eachDay(from, to);
    const logsByDate = new Map<string, PrayerLog[]>();
    for (const log of logs) {
      const list = logsByDate.get(log.prayer_date) ?? [];
      list.push(log);
      logsByDate.set(log.prayer_date, list);
    }

    const dailyData: DailyData[] = days.map((date) => {
      const dayLogs = logsByDate.get(date) ?? [];
      const completed = dayLogs.filter((l) => l.status.startsWith('completed')).length;
      return { date, completed, total: 6, pct: Math.round((completed / 6) * 100) };
    });

    // Per-prayer stats
    const prayerStats: PrayerStat[] = PRAYER_NAMES.map((name) => {
      const matching = logs.filter((l) => l.prayer_name === name);
      const completed = matching.filter((l) => l.status.startsWith('completed')).length;
      const total = days.length;
      return { prayerName: name, completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
    });

    // Streaks — count consecutive days with at least 5/6 completed
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
      // recalculate from the end
      for (let i = dailyData.length - 1; i >= 0; i--) {
        if (dailyData[i].completed >= 5) currentStreak++;
        else break;
      }
    }

    return { dailyData, prayerStats, currentStreak, bestStreak };
  }, [logs, from, to]);

  return {
    range,
    setRange,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    from,
    to,
    dailyData,
    prayerStats,
    currentStreak,
    bestStreak,
    isPending,
  };
}
