import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Sparkles } from 'lucide-react';

interface CheckinSuccessProps {
  streak: number;
  totalPoints: number;
  aiTip: string | null;
}

export function CheckinSuccess({ streak, totalPoints, aiTip }: CheckinSuccessProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-md py-12 px-4 space-y-6">
      <div className="text-center space-y-4">
        <div className="text-6xl animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold">{t('wellness.thankYou')}</h2>
        <div className="flex justify-center gap-3">
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" /> {streak} {t('wellness.dayStreak')}
          </Badge>
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" /> {totalPoints} {t('wellness.points')}
          </Badge>
        </div>
      </div>

      {aiTip && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary">{t('wellness.yourTip')}</p>
                <p className="text-sm leading-relaxed">{aiTip}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
