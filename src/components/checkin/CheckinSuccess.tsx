import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Sparkles, CheckCircle2 } from 'lucide-react';

interface CheckinSuccessProps {
  streak: number;
  totalPoints: number;
  aiTip: string | null;
  alreadyDone?: boolean;
}

const EMOJIS = ['🎉', '🌟', '✨', '💪', '🎊'];

export function CheckinSuccess({ streak, totalPoints, aiTip, alreadyDone }: CheckinSuccessProps) {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-md py-12 px-4 space-y-6">
      <div className="text-center space-y-4">
        {/* Emoji burst */}
        <div className="relative h-20 flex items-center justify-center">
          {EMOJIS.map((emoji, i) => (
            <span
              key={i}
              className="absolute text-2xl animate-in fade-in zoom-in-50 duration-500"
              style={{
                animationDelay: `${i * 100}ms`,
                transform: `translate(${(i - 2) * 30}px, ${Math.abs(i - 2) * -10}px) rotate(${(i - 2) * 15}deg)`,
              }}
            >
              {emoji}
            </span>
          ))}
          <span className="text-6xl relative z-10 animate-in zoom-in-50 duration-500">
            {alreadyDone ? '✅' : '🎉'}
          </span>
        </div>

        <h2 className="text-2xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-500">
          {alreadyDone ? t('wellness.alreadyCheckedIn', "You've already checked in today!") : t('wellness.thankYou')}
        </h2>

        {alreadyDone && (
          <p className="text-sm text-muted-foreground animate-in fade-in duration-700">
            {t('wellness.comeBackTomorrow', 'Come back tomorrow to continue your streak!')}
          </p>
        )}

        <div className="flex justify-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '200ms' }}>
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full gap-1.5">
            <Flame className="h-4 w-4 text-orange-500" /> {streak} {t('wellness.dayStreak')}
          </Badge>
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full gap-1.5">
            <Star className="h-4 w-4 text-yellow-500" /> {totalPoints} {t('wellness.points')}
          </Badge>
        </div>
      </div>

      {aiTip && (
        <Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
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
