import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { typography } from "@/theme/tokens";

interface WinnerAnnouncementProps {
  winners: { rank: number; name: string; score: number }[];
  themeName: string;
}

export function WinnerAnnouncement({ winners, themeName }: WinnerAnnouncementProps) {
  const { t } = useTranslation();

  if (!winners.length) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <Star className="h-10 w-10 text-primary mx-auto mb-2" />
          <h3 className="text-lg font-bold">{themeName}</h3>
          <p className={typography.subtitle}>{t('recognition.results.winnersAnnounced')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {winners.map((w) => (
            <div
              key={w.rank}
              className={`flex flex-col items-center p-4 rounded-lg border ${
                w.rank === 1 ? 'bg-primary/10 border-primary/30' : 'bg-muted/50'
              }`}
            >
              <Star className={`h-6 w-6 mb-2 ${
                w.rank === 1 ? 'text-yellow-500' : w.rank === 2 ? 'text-gray-400' : 'text-amber-600'
              }`} />
              <span className="text-xs text-muted-foreground">
                {t(`recognition.results.place${w.rank}` as any)}
              </span>
              <span className="font-semibold mt-1">{w.name}</span>
              <span className={typography.subtitle}>{w.score.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
