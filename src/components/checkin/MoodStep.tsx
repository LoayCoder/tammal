import { useTranslation } from 'react-i18next';
import { useMoodDefinitions, type MoodDefinition } from '@/hooks/wellness/useMoodDefinitions';
import { Skeleton } from '@/components/ui/skeleton';
import { FALLBACK_MOODS, getMoodStyle, MOOD_COLOR_STYLES, DEFAULT_MOOD_COLOR_STYLE } from '@/config/moods';
import React from 'react';

// Re-export for backward compat
export const MOODS = FALLBACK_MOODS;

interface MoodStepProps {
  selectedMood: string | null;
  onSelect: (mood: string) => void;
  tenantId?: string | null;
}

export const MoodStep = React.forwardRef<HTMLDivElement, MoodStepProps>(function MoodStep({ selectedMood, onSelect, tenantId }, ref) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { activeMoods, isPending: isLoading } = useMoodDefinitions(tenantId ?? null);

  // Use dynamic moods if loaded, fallback to static
  const displayMoods = activeMoods.length > 0
    ? activeMoods.map(m => ({
        level: m.key,
        score: m.score,
        emoji: m.emoji,
        label: isRTL ? m.label_ar : m.label_en,
        ...getMoodStyle(m.color),
      }))
    : MOODS.map(m => ({
        ...m,
        label: t(`wellness.mood.${m.level}`),
      }));

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="text-center space-y-1">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">{t('wellness.howAreYou')}</h2>
        <p className="text-muted-foreground/60 text-xs">{t('wellness.selectMood')}</p>
      </div>

      <div className={`grid gap-2.5`} style={{ gridTemplateColumns: `repeat(${Math.min(displayMoods.length, 5)}, minmax(0, 1fr))` }}>
        {displayMoods.map(mood => {
          const isSelected = selectedMood === mood.level;
          return (
            <button
              key={mood.level}
              onClick={() => onSelect(mood.level)}
              className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl transition-all duration-200 ease-out ${
                isSelected
                  ? 'bg-primary/[0.06] dark:bg-primary/[0.1] shadow-[0_2px_8px_rgba(0,0,0,0.06)] scale-[1.04] border border-primary/20'
                  : 'bg-muted/40 dark:bg-muted/20 shadow-[0_1px_2px_rgba(0,0,0,0.04)] border border-border/30 hover:bg-muted/60 hover:scale-[1.02] active:scale-[0.97]'
              }`}
            >
              <span
                className={`text-xl sm:text-2xl transition-transform duration-200 ${isSelected ? 'scale-105' : ''}`}
                role="img"
                aria-label={mood.level}
              >
                {mood.emoji}
              </span>
              <span className={`text-2xs sm:text-xs leading-tight text-center ${isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
