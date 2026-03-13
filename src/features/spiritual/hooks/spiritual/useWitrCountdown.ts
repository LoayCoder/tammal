import { useState, useEffect, useCallback } from 'react';

interface WitrCountdownResult {
  minutesLeft: number | null;
  isExpired: boolean;
  isPrayerTime: boolean;
}

const WITR_START_HOUR = 22; // 10:00 PM

/**
 * Countdown hook for Al-Witr prayer.
 * Window: 22:00 (10 PM) until Fajr adhan time.
 * `fajrTimeStr` is "HH:mm" (may include " (EET)" suffix from Aladhan).
 */
export function useWitrCountdown(fajrTimeStr?: string): WitrCountdownResult {
  const calc = useCallback((): WitrCountdownResult => {
    if (!fajrTimeStr) return { minutesLeft: null, isExpired: false, isPrayerTime: false };

    const clean = fajrTimeStr.replace(/\s*\(.*\)/, '').trim();
    const [fH, fM] = clean.split(':').map(Number);
    if (isNaN(fH) || isNaN(fM)) return { minutesLeft: null, isExpired: false, isPrayerTime: false };

    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();

    // Fajr deadline for today
    const fajrToday = new Date(now);
    fajrToday.setHours(fH, fM, 0, 0);

    // Case 1: It's after 10 PM — Witr window is open, deadline is tomorrow's Fajr
    if (currentH >= WITR_START_HOUR) {
      const fajrTomorrow = new Date(now);
      fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
      fajrTomorrow.setHours(fH, fM, 0, 0);
      const diffMs = fajrTomorrow.getTime() - now.getTime();
      return {
        minutesLeft: Math.ceil(diffMs / 60000),
        isExpired: false,
        isPrayerTime: true,
      };
    }

    // Case 2: It's before Fajr (e.g. 1 AM–4 AM) — still in last night's Witr window
    if (now < fajrToday) {
      const diffMs = fajrToday.getTime() - now.getTime();
      return {
        minutesLeft: Math.ceil(diffMs / 60000),
        isExpired: false,
        isPrayerTime: true,
      };
    }

    // Case 3: After Fajr and before 10 PM — Witr window is closed
    // Between Fajr and 10 PM, check if expired (post-Fajr = missed window)
    if (currentH < WITR_START_HOUR) {
      return { minutesLeft: 0, isExpired: true, isPrayerTime: false };
    }

    return { minutesLeft: null, isExpired: false, isPrayerTime: false };
  }, [fajrTimeStr]);

  const [state, setState] = useState<WitrCountdownResult>(calc);

  useEffect(() => {
    setState(calc());
    const id = setInterval(() => setState(calc()), 30_000);
    return () => clearInterval(id);
  }, [calc]);

  return state;
}
