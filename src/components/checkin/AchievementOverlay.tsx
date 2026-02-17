import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flame, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AchievementOverlayProps {
  streak: number;
  points: number;
  aiTip: string | null;
  onDismiss: () => void;
}

const EMOJIS = ['🎉', '🌟', '✨', '💪', '🎊'];

export function AchievementOverlay({ streak, points, aiTip, onDismiss }: AchievementOverlayProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('visible'), 50);
    const exitTimer = setTimeout(() => setPhase('exit'), 4000);
    const dismissTimer = setTimeout(onDismiss, 4600);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        phase === 'exit' ? 'opacity-0 scale-95' : phase === 'visible' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-10 max-w-sm w-full">
        {/* Emoji burst */}
        <div className="relative h-24 flex items-center justify-center">
          {EMOJIS.map((emoji, i) => (
            <span
              key={i}
              className="absolute text-3xl animate-in fade-in zoom-in-50 duration-500"
              style={{
                animationDelay: `${i * 120}ms`,
                transform: `translate(${(i - 2) * 35}px, ${Math.abs(i - 2) * -15}px) rotate(${(i - 2) * 15}deg)`,
              }}
            >
              {emoji}
            </span>
          ))}
          <span className="text-7xl relative z-10 animate-in zoom-in-50 duration-700">🎉</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: '200ms' }}>
          {t('wellness.thankYou')}
        </h2>

        {/* Badges */}
        <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '400ms' }}>
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full gap-1.5">
            <Flame className="h-4 w-4 text-chart-4" /> {streak} {t('wellness.dayStreak')}
          </Badge>
          <Badge variant="secondary" className="text-sm px-4 py-2 rounded-full gap-1.5">
            <Star className="h-4 w-4 text-chart-1" /> +{points} {t('wellness.points')}
          </Badge>
        </div>

        {/* AI Tip */}
        {aiTip && (
          <div
            className="w-full rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-5 duration-500"
            style={{ animationDelay: '600ms' }}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary">{t('wellness.yourTip')}</p>
                <p className="text-sm leading-relaxed">{aiTip}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground animate-in fade-in duration-500" style={{ animationDelay: '800ms' }}>
          {t('wellness.tapToDismiss', 'Tap anywhere to dismiss')}
        </p>
      </div>
    </div>
  );
}
