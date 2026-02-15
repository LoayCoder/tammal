import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smile, Meh, Frown, AlertTriangle } from 'lucide-react';

export const MOODS = [
  { level: 'great', score: 5, icon: Smile, color: 'text-green-500' },
  { level: 'good', score: 4, icon: Smile, color: 'text-emerald-400' },
  { level: 'okay', score: 3, icon: Meh, color: 'text-yellow-500' },
  { level: 'struggling', score: 2, icon: Frown, color: 'text-orange-500' },
  { level: 'need_help', score: 1, icon: AlertTriangle, color: 'text-red-500' },
] as const;

interface MoodStepProps {
  selectedMood: string | null;
  onSelect: (mood: string) => void;
}

export function MoodStep({ selectedMood, onSelect }: MoodStepProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('wellness.howAreYou')}</CardTitle>
        <CardDescription>{t('wellness.selectMood')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map(mood => {
            const Icon = mood.icon;
            const isSelected = selectedMood === mood.level;
            return (
              <button
                key={mood.level}
                onClick={() => onSelect(mood.level)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted-foreground/20'
                }`}
              >
                <Icon className={`h-8 w-8 ${mood.color}`} />
                <span className="text-xs font-medium">{t(`wellness.mood.${mood.level}`)}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
