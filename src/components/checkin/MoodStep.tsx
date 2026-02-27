import { useTranslation } from 'react-i18next';
import { useMoodDefinitions, type MoodDefinition } from '@/hooks/wellness/useMoodDefinitions';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

// Tailwind color mapping for dynamic mood colors
const COLOR_STYLES: Record<string, { bgFrom: string; bgTo: string; border: string; activeBorder: string; ring: string; text: string }> = {
  'text-chart-1': { bgFrom: 'from-emerald-500/20', bgTo: 'to-emerald-600/10', border: 'border-emerald-500/40', activeBorder: 'border-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-500' },
  'text-chart-2': { bgFrom: 'from-blue-500/20', bgTo: 'to-blue-600/10', border: 'border-blue-500/40', activeBorder: 'border-blue-500', ring: 'ring-blue-500/30', text: 'text-blue-500' },
  'text-chart-3': { bgFrom: 'from-purple-500/20', bgTo: 'to-purple-600/10', border: 'border-purple-500/40', activeBorder: 'border-purple-500', ring: 'ring-purple-500/30', text: 'text-purple-500' },
  'text-chart-4': { bgFrom: 'from-yellow-500/20', bgTo: 'to-yellow-600/10', border: 'border-yellow-500/40', activeBorder: 'border-yellow-500', ring: 'ring-yellow-500/30', text: 'text-yellow-500' },
  'text-chart-5': { bgFrom: 'from-pink-500/20', bgTo: 'to-pink-600/10', border: 'border-pink-500/40', activeBorder: 'border-pink-500', ring: 'ring-pink-500/30', text: 'text-pink-500' },
  'text-destructive': { bgFrom: 'from-red-500/20', bgTo: 'to-red-600/10', border: 'border-red-500/40', activeBorder: 'border-red-500', ring: 'ring-red-500/30', text: 'text-red-500' },
  'text-primary': { bgFrom: 'from-primary/20', bgTo: 'to-primary/10', border: 'border-primary/40', activeBorder: 'border-primary', ring: 'ring-primary/30', text: 'text-primary' },
  'text-muted-foreground': { bgFrom: 'from-gray-500/20', bgTo: 'to-gray-600/10', border: 'border-gray-500/40', activeBorder: 'border-gray-500', ring: 'ring-gray-500/30', text: 'text-gray-500' },
};

// Fallback for legacy hardcoded usage
export const MOODS = [
  { level: 'great', score: 5, emoji: '😄', bgFrom: 'from-emerald-500/20', bgTo: 'to-emerald-600/10', border: 'border-emerald-500/40', activeBorder: 'border-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-500' },
  { level: 'good', score: 4, emoji: '🙂', bgFrom: 'from-green-500/20', bgTo: 'to-green-600/10', border: 'border-green-500/40', activeBorder: 'border-green-500', ring: 'ring-green-500/30', text: 'text-green-500' },
  { level: 'okay', score: 3, emoji: '😐', bgFrom: 'from-yellow-500/20', bgTo: 'to-yellow-600/10', border: 'border-yellow-500/40', activeBorder: 'border-yellow-500', ring: 'ring-yellow-500/30', text: 'text-yellow-500' },
  { level: 'struggling', score: 2, emoji: '😟', bgFrom: 'from-orange-500/20', bgTo: 'to-orange-600/10', border: 'border-orange-500/40', activeBorder: 'border-orange-500', ring: 'ring-orange-500/30', text: 'text-orange-500' },
  { level: 'need_help', score: 1, emoji: '😢', bgFrom: 'from-red-500/20', bgTo: 'to-red-600/10', border: 'border-red-500/40', activeBorder: 'border-red-500', ring: 'ring-red-500/30', text: 'text-red-500' },
] as const;

const DEFAULT_STYLE = COLOR_STYLES['text-chart-4'];

function getMoodStyle(color: string) {
  return COLOR_STYLES[color] || DEFAULT_STYLE;
}

interface MoodStepProps {
  selectedMood: string | null;
  onSelect: (mood: string) => void;
  tenantId?: string | null;
}

export const MoodStep = React.forwardRef<HTMLDivElement, MoodStepProps>(function MoodStep({ selectedMood, onSelect, tenantId }, ref) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { activeMoods, isLoading } = useMoodDefinitions(tenantId ?? null);

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
