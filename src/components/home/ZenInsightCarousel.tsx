import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { Flame } from 'lucide-react';
import type { MoodDataPoint } from '@/hooks/wellness/useMoodHistory';

interface ZenInsightCarouselProps {
  moodData: MoodDataPoint[];
  streak: number;
  avgMood7d: number;
  burnoutZone: 'thriving' | 'watch' | 'atRisk';
}

export function ZenInsightCarousel({ moodData, streak, avgMood7d, burnoutZone }: ZenInsightCarouselProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const TOTAL = 3;

  const next = useCallback(() => setActive(p => (p + 1) % TOTAL), []);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const last7 = moodData.slice(-7);
  const capacityPercent = Math.round((avgMood7d / 5) * 100);
  const circumference = Math.PI * 80; // semi-circle r=80
  const offset = circumference - (capacityPercent / 100) * circumference;

  const zoneColor = burnoutZone === 'thriving'
    ? 'hsl(160 84% 39%)' // emerald
    : burnoutZone === 'watch'
      ? 'hsl(38 92% 50%)'
      : 'hsl(0 72% 50%)';

  return (
    <div className="relative min-h-[180px]">
      {/* Slide 1: Mood Trend */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center zen-slide ${active === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <p className="text-xs font-medium mb-2" style={{ color: 'hsl(215 25% 72%)' }}>
          {t('home.moodTrend')} — {t('checkinMonitor.dateRange.7d')}
        </p>
        {last7.length > 1 ? (
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={last7}>
              <defs>
                <linearGradient id="zenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="score"
                stroke="hsl(160 84% 39%)"
                strokeWidth={2.5}
                fill="url(#zenGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm" style={{ color: 'hsl(215 25% 60%)' }}>{t('home.noMoodData')}</p>
        )}
      </div>

      {/* Slide 2: Streak */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center zen-slide ${active === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Flame className="h-10 w-10 mb-2" style={{ color: 'hsl(25 95% 53%)' }} />
        <span className="text-4xl font-bold" style={{ color: 'hsl(210 40% 98%)' }}>{streak}</span>
        <p className="text-sm mt-1" style={{ color: 'hsl(215 25% 72%)' }}>{t('home.dayStreak')}</p>
      </div>

      {/* Slide 3: Wellness Gauge */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center zen-slide ${active === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <svg viewBox="0 0 180 100" className="w-40 h-20">
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke="hsl(217 33% 25%)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 90 A 80 80 0 0 1 170 90"
            fill="none"
            stroke={zoneColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 800ms ease' }}
          />
        </svg>
        <span className="text-2xl font-bold -mt-2" style={{ color: 'hsl(210 40% 98%)' }}>
          {capacityPercent}%
        </span>
        <p className="text-xs mt-0.5" style={{ color: 'hsl(215 25% 72%)' }}>
          {t('home.burnout')}
        </p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-0 inset-x-0 flex justify-center gap-2 pb-1">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: active === i ? 24 : 8,
              background: active === i ? 'hsl(259 67% 67%)' : 'hsl(215 20% 40%)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
