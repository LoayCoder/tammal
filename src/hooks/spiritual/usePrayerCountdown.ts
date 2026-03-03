import { useState, useEffect, useRef, useCallback } from 'react';

interface CountdownResult {
  minutesLeft: number | null; // null = prayer time hasn't arrived yet
  isExpired: boolean;
  isPrayerTime: boolean;
}

/**
 * Returns countdown info for a single prayer's 1-hour logging window.
 * `prayerTimeStr` is "HH:mm" (may include " (EET)" suffix from Aladhan).
 */
export function usePrayerCountdown(prayerTimeStr?: string): CountdownResult {
  const calc = useCallback((): CountdownResult => {
    if (!prayerTimeStr) return { minutesLeft: null, isExpired: false, isPrayerTime: false };

    // Strip timezone labels like " (EET)"
    const clean = prayerTimeStr.replace(/\s*\(.*\)/, '').trim();
    const [h, m] = clean.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return { minutesLeft: null, isExpired: false, isPrayerTime: false };

    const now = new Date();
    const prayerDate = new Date(now);
    prayerDate.setHours(h, m, 0, 0);

    const deadline = new Date(prayerDate.getTime() + 60 * 60 * 1000); // +1 hour
    const diffMs = deadline.getTime() - now.getTime();

    if (now < prayerDate) {
      // Prayer time hasn't arrived yet
      return { minutesLeft: null, isExpired: false, isPrayerTime: false };
    }

    if (diffMs <= 0) {
      // More than 1 hour has passed
      return { minutesLeft: 0, isExpired: true, isPrayerTime: true };
    }

    return {
      minutesLeft: Math.ceil(diffMs / 60000),
      isExpired: false,
      isPrayerTime: true,
    };
  }, [prayerTimeStr]);

  const [state, setState] = useState<CountdownResult>(calc);

  useEffect(() => {
    setState(calc());
    const id = setInterval(() => setState(calc()), 30_000);
    return () => clearInterval(id);
  }, [calc]);

  return state;
}
