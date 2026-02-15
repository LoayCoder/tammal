import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Star } from 'lucide-react';

interface CheckinSuccessProps {
  streak: number;
  totalPoints: number;
  aiTip: string | null;
}

export function CheckinSuccess({ streak, totalPoints, aiTip }: CheckinSuccessProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-lg py-8 px-4 space-y-6">
      <Card>
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">{t('wellness.thankYou')}</h2>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary" className="text-base px-3 py-1">
              <Flame className="h-4 w-4 me-1" /> {streak} {t('wellness.dayStreak')}
            </Badge>
            <Badge variant="secondary" className="text-base px-3 py-1">
              <Star className="h-4 w-4 me-1" /> {totalPoints} {t('wellness.points')}
            </Badge>
          </div>
          {aiTip && (
            <Card className="bg-muted">
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground font-medium mb-1">💡 {t('wellness.yourTip')}</p>
                <p className="text-sm">{aiTip}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
