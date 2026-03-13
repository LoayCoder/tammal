import { useState, useRef, useCallback, useEffect } from 'react';

interface TimerState {
  surahName: string;
  juzNumber: number | null;
  startTime: number;
}

export function useReadingTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const stateRef = useRef<TimerState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback((surahName: string, juzNumber: number | null = null) => {
    clearTimer();
    stateRef.current = { surahName, juzNumber, startTime: Date.now() };
    setElapsedSeconds(0);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      if (stateRef.current) {
        setElapsedSeconds(Math.floor((Date.now() - stateRef.current.startTime) / 1000));
      }
    }, 1000);
  }, [clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    const state = stateRef.current;
    if (!state) return null;
    const durationSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const result = {
      durationMinutes: Math.round(durationSeconds / 60),
      durationSeconds,
      surahName: state.surahName,
      juzNumber: state.juzNumber,
    };
    stateRef.current = null;
    setElapsedSeconds(0);
    return result;
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    stateRef.current = null;
    setElapsedSeconds(0);
    setIsRunning(false);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  return {
    elapsedSeconds,
    isRunning,
    start,
    stop,
    reset,
    formatTime,
    currentSurah: stateRef.current?.surahName ?? null,
  };
}
