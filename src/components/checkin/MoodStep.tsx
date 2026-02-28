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
    <div ref={ref} className="space-y-3">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">{t('wellness.howAreYou')}</h2>
        <p className="text-muted-foreground text-xs">{t('wellness.selectMood')}</p>
      </div>

      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(displayMoods.length, 5)}, minmax(0, 1fr))` }}>
        {displayMoods.map(mood => {
          const isSelected = selectedMood === mood.level;
          return (
            <button
              key={mood.level}
              onClick={() => onSelect(mood.level)}
              className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 bg-gradient-to-b ${mood.bgFrom} ${mood.bgTo} active:scale-95 ${
                isSelected
                  ? `${mood.activeBorder} ring-2 ${mood.ring} scale-105`
                  : `${mood.border} opacity-80 hover:opacity-100 hover:scale-[1.03]`
              }`}
            >
              <span
                className={`text-2xl sm:text-3xl transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}
                role="img"
                aria-label={mood.level}
              >
                {mood.emoji}
              </span>
              <span className={`text-[10px] sm:text-xs font-semibold leading-tight text-center ${isSelected ? mood.text : 'text-muted-foreground'}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});
