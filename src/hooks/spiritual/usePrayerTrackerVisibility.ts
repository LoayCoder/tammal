import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'prayer-tracker-hidden';

interface HiddenState {
  hiddenAt: number;       // timestamp when hidden
  ishaHasPassed: boolean; // whether Isha had passed when user hid
}

/**
 * Controls Prayer Tracker visibility with smart auto-return:
 * - Hidden before Isha → reappears after 1 hour
 * - Hidden after Isha  → reappears next day (after midnight)
 */
export function usePrayerTrackerVisibility(ishaTimeStr?: string) {
  const [isHidden, setIsHidden] = useState(false);

  // Check if Isha time has passed right now
  const hasIshaPassed = useCallback((): boolean => {
    if (!ishaTimeStr) return false;
    const clean = ishaTimeStr.replace(/\s*\(.*\)/, '').trim();
    const [h, m] = clean.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return false;
    const now = new Date();
    const isha = new Date();
    isha.setHours(h, m, 0, 0);
    return now >= isha;
  }, [ishaTimeStr]);

  // On mount + periodically, check if we should auto-show
  const checkVisibility = useCallback(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setIsHidden(false);
      return;
    }

    try {
      const state: HiddenState = JSON.parse(raw);
      const now = Date.now();
      const hiddenDate = new Date(state.hiddenAt);
      const today = new Date();

      // If hidden on a previous day → show again
      if (
        hiddenDate.getDate() !== today.getDate() ||
        hiddenDate.getMonth() !== today.getMonth() ||
        hiddenDate.getFullYear() !== today.getFullYear()
      ) {
        localStorage.removeItem(STORAGE_KEY);
        setIsHidden(false);
        return;
      }

      if (state.ishaHasPassed) {
        // Hidden after Isha → stay hidden until next day
        setIsHidden(true);
      } else {
        // Hidden before Isha → reappear after 1 hour
        const elapsed = now - state.hiddenAt;
        if (elapsed >= 60 * 60 * 1000) {
          localStorage.removeItem(STORAGE_KEY);
          setIsHidden(false);
        } else {
          setIsHidden(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setIsHidden(false);
    }
  }, []);

  useEffect(() => {
    checkVisibility();
    const interval = setInterval(checkVisibility, 30_000);
    return () => clearInterval(interval);
  }, [checkVisibility]);

  const hide = useCallback(() => {
    const state: HiddenState = {
      hiddenAt: Date.now(),
      ishaHasPassed: hasIshaPassed(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setIsHidden(true);
  }, [hasIshaPassed]);

  const show = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsHidden(false);
  }, []);

  return { isHidden, hide, show };
}
