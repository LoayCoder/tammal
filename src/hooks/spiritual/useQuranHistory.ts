import { useMemo, useState } from 'react';
import { useQuranSessions, type QuranSession } from './useQuranSessions';

export type QuranHistoryRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

function offsetDate(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDateRange(range: QuranHistoryRange, customFrom?: string, customTo?: string) {
  const today = new Date();
  const to = today.toISOString().split('T')[0];
  let from = to;
  switch (range) {
    case 'week': from = offsetDate(today, -6); break;
    case 'month': from = offsetDate(today, -29); break;
    case 'quarter': from = offsetDate(today, -89); break;
    case 'year': from = offsetDate(today, -364); break;
    case 'custom':
      from = customFrom ?? offsetDate(today, -6);
      return { from, to: customTo ?? to };
  }
  return { from, to };
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

export interface QuranDailyData {
  date: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface SurahStat {
  name: string;
  count: number;
  totalMinutes: number;
}

export function useQuranHistory() {
  const [range, setRange] = useState<QuranHistoryRange>('week');
  const [customFrom, setCustomFrom] = useState<string | undefined>();
  const [customTo, setCustomTo] = useState<string | undefined>();

  const { from, to } = useMemo(
    () => getDateRange(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  const { sessions, isPending } = useQuranSessions({ from, to });

  const { dailyData, topSurahs, currentStreak, bestStreak, totalMinutes, totalSessions, avgMinutesPerSession, activeDays } = useMemo(() => {
    const days = eachDay(from, to);

    const byDate = new Map<string, QuranSession[]>();
    for (const s of sessions) {
      const list = byDate.get(s.session_date) ?? [];
      list.push(s);
      byDate.set(s.session_date, list);
    }

    const dailyData: QuranDailyData[] = days.map((date) => {
      const daySessions = byDate.get(date) ?? [];
      return {
        date,
        totalMinutes: daySessions.reduce((sum, s) => sum + s.duration_minutes, 0),
        sessionCount: daySessions.length,
      };
    });

    // Top surahs
    const surahMap = new Map<string, { count: number; totalMinutes: number }>();
    for (const s of sessions) {
      if (!s.surah_name) continue;
      const existing = surahMap.get(s.surah_name) ?? { count: 0, totalMinutes: 0 };
      existing.count++;
      existing.totalMinutes += s.duration_minutes;
      surahMap.set(s.surah_name, existing);
    }
    const topSurahs: SurahStat[] = Array.from(surahMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let streak = 0;
    for (let i = dailyData.length - 1; i >= 0; i--) {
      if (dailyData[i].sessionCount > 0) {
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
        if (dailyData[i].sessionCount > 0) currentStreak++;
        else break;
      }
    }

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalSessions = sessions.length;
    const activeDays = dailyData.filter((d) => d.sessionCount > 0).length;
    const avgMinutesPerSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;

    return { dailyData, topSurahs, currentStreak, bestStreak, totalMinutes, totalSessions, avgMinutesPerSession, activeDays };
  }, [sessions, from, to]);

  return {
    range, setRange,
    customFrom, customTo, setCustomFrom, setCustomTo,
    from, to,
    dailyData, topSurahs,
    currentStreak, bestStreak,
    totalMinutes, totalSessions, avgMinutesPerSession, activeDays,
    isPending,
  };
}
