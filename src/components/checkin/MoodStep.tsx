import { useTranslation } from 'react-i18next';

export const MOODS = [
  { level: 'great', score: 5, emoji: '😄', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/30', activeBg: 'bg-green-500/20 border-green-500 ring-2 ring-green-500/30' },
  { level: 'good', score: 4, emoji: '🙂', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', activeBg: 'bg-emerald-400/20 border-emerald-400 ring-2 ring-emerald-400/30' },
  { level: 'okay', score: 3, emoji: '😐', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30', activeBg: 'bg-yellow-500/20 border-yellow-500 ring-2 ring-yellow-500/30' },
  { level: 'struggling', score: 2, emoji: '😟', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', activeBg: 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/30' },
  { level: 'need_help', score: 1, emoji: '😢', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', activeBg: 'bg-red-500/20 border-red-500 ring-2 ring-red-500/30' },
] as const;

interface MoodStepProps {
  selectedMood: string | null;
  onSelect: (mood: string) => void;
}

export function MoodStep({ selectedMood, onSelect }: MoodStepProps) {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t('wellness.howAreYou')}</h2>
        <p className="text-muted-foreground text-sm">{t('wellness.selectMood')}</p>
      </div>

      <div className="flex justify-center gap-3">
        {MOODS.map(mood => {
          const isSelected = selectedMood === mood.level;
          return (
            <button
              key={mood.level}
              onClick={() => onSelect(mood.level)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                isSelected
                  ? `${mood.activeBg} animate-in zoom-in-95 duration-200`
                  : `${mood.bg} hover:border-muted-foreground/30`
              }`}
            >
              <span
                className={`text-4xl transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}
                role="img"
                aria-label={mood.level}
              >
                {mood.emoji}
              </span>
              <span className={`text-xs font-semibold ${isSelected ? mood.color : 'text-muted-foreground'}`}>
                {t(`wellness.mood.${mood.level}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
