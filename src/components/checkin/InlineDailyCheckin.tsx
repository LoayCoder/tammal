import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useGamification } from '@/hooks/wellness/useGamification';
import { Flame, Star, Loader2, Send, RefreshCw } from 'lucide-react';
import { MoodStep } from '@/components/checkin/MoodStep';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { AchievementOverlay } from '@/components/checkin/AchievementOverlay';
import { MoodPathwayQuestions, type PathwayAnswer } from '@/components/checkin/MoodPathwayQuestions';
import { useTodayEntry } from '@/hooks/checkin/useTodayEntry';
import { useCheckinSubmit } from '@/hooks/checkin/useCheckinSubmit';

interface InlineDailyCheckinProps {
  employeeId: string;
  tenantId: string;
  userId: string;
}

export function InlineDailyCheckin({ employeeId, tenantId, userId }: InlineDailyCheckinProps) {
  const { t, i18n } = useTranslation();
  
  const { streak, totalPoints } = useGamification(employeeId);
  const { moods: moodDefinitions } = useMoodDefinitions(tenantId);

  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntry, isLoading: entryLoading } = useTodayEntry(employeeId, today);

  const { submitCheckin, isSubmitting: submitting, error: submitError } = useCheckinSubmit();

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [pathwayAnswers, setPathwayAnswers] = useState<PathwayAnswer[]>([]);
  const [comment, setComment] = useState('');
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState<{ streak: number; points: number; tip: string | null }>({ streak: 0, points: 0, tip: null });

  const moodDef = moodDefinitions?.find(m => m.key === selectedMood);
  const moodObj = moodDef ? { level: moodDef.key, score: moodDef.score } : null;

  const handleDismissAchievement = useCallback(() => {
    setShowAchievement(false);
  }, []);

  const handleSubmit = async () => {
    if (!selectedMood || !moodObj) return;

    const answerValue = {
      pathway: pathwayAnswers.map(a => ({ theme: a.theme, answer: a.selectedOption, freeText: a.freeText })),
    };

    const result = await submitCheckin({
      tenantId,
      employeeId,
      userId,
      moodLevel: selectedMood,
      moodScore: moodObj.score,
      comment: comment || null,
      supportActions: [],
      answerValue,
      currentStreak: streak,
      entryDate: today,
      language: document.documentElement.lang || 'en',
      pathwayAnswers: pathwayAnswers.map(a => ({ theme: a.theme, selectedOption: a.selectedOption, freeText: a.freeText })),
    });

    if (result) {
      setAchievementData({ streak: result.newStreak, points: result.pointsEarned, tip: result.tip });
      setShowAchievement(true);
      setSelectedMood(null);
      setComment('');
    }
  };

  if (entryLoading) return <Skeleton className="h-48 w-full rounded-lg" />;
  if (todayEntry) return null;

  return (
    <>
      {showAchievement && (
        <AchievementOverlay
          streak={achievementData.streak}
          points={achievementData.points}
          aiTip={achievementData.tip}
          onDismiss={handleDismissAchievement}
        />
      )}

      <Card className="premium-card-vip overflow-hidden rounded-2xl border-[#69cbfc]/25">
        <CardContent className="p-5 sm:p-6 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-primary/8 to-transparent shadow-sm">
                <span className="text-xl">💭</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">{t('nav.dailyCheckin')}</h3>
                <p className="text-2xs text-muted-foreground mt-0.5">{t('wellness.howAreYou', 'How are you feeling today?')}</p>
              </div>
            </div>
          </div>

          {/* 1. Mood Selection — always visible */}
          <MoodStep selectedMood={selectedMood} onSelect={setSelectedMood} tenantId={tenantId} />

          {/* 2. Mood Pathway Questions — the single source of follow-up questions */}
          {selectedMood && moodObj && (
            <MoodPathwayQuestions
              moodLevel={selectedMood}
              moodScore={moodObj.score}
              tenantId={tenantId}
              language={i18n.language}
              onAnswersChange={setPathwayAnswers}
            />
          )}

          {/* 3. Optional note — show after mood */}
          {selectedMood && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={t('wellness.addComment')}
                rows={2}
                className="resize-none text-sm rounded-xl border-border/40 bg-card/50"
                dir="auto"
              />
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-xl p-3">
              <span className="flex-1">{submitError}</span>
              <Button variant="ghost" size="sm" onClick={handleSubmit} className="gap-1 shrink-0 h-7">
                <RefreshCw className="h-3 w-3" /> {t('common.retry', 'Retry')}
              </Button>
            </div>
          )}

          {/* Submit button */}
          {selectedMood && (
            <Button
              className="w-full rounded-xl h-11 text-sm gap-2 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {t('wellness.submitCheckin')}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
}
