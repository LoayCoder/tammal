import { useTranslation } from 'react-i18next';

export const MOODS = [
  { level: 'great', score: 5, emoji: '😄', bgFrom: 'from-emerald-500/20', bgTo: 'to-emerald-600/10', border: 'border-emerald-500/40', activeBorder: 'border-emerald-500', ring: 'ring-emerald-500/30', text: 'text-emerald-500' },
  { level: 'good', score: 4, emoji: '🙂', bgFrom: 'from-green-500/20', bgTo: 'to-green-600/10', border: 'border-green-500/40', activeBorder: 'border-green-500', ring: 'ring-green-500/30', text: 'text-green-500' },
  { level: 'okay', score: 3, emoji: '😐', bgFrom: 'from-yellow-500/20', bgTo: 'to-yellow-600/10', border: 'border-yellow-500/40', activeBorder: 'border-yellow-500', ring: 'ring-yellow-500/30', text: 'text-yellow-500' },
  { level: 'struggling', score: 2, emoji: '😟', bgFrom: 'from-orange-500/20', bgTo: 'to-orange-600/10', border: 'border-orange-500/40', activeBorder: 'border-orange-500', ring: 'ring-orange-500/30', text: 'text-orange-500' },
  { level: 'need_help', score: 1, emoji: '😢', bgFrom: 'from-red-500/20', bgTo: 'to-red-600/10', border: 'border-red-500/40', activeBorder: 'border-red-500', ring: 'ring-red-500/30', text: 'text-red-500' },
] as const;

interface MoodStepProps {
  selectedMood: string | null;
  onSelect: (mood: string) => void;
}

export function MoodStep({ selectedMood, onSelect }: MoodStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-bold">{t('wellness.howAreYou')}</h2>
        <p className="text-muted-foreground text-xs">{t('wellness.selectMood')}</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {MOODS.map(mood => {
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
                {t(`wellness.mood.${mood.level}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
