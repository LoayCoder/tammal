import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGamification } from '@/hooks/wellness/useGamification';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useTodayEntry } from '@/hooks/checkin/useTodayEntry';
import { useCheckinSubmit } from '@/hooks/checkin/useCheckinSubmit';
import { useMoodDefinitions } from '@/hooks/wellness/useMoodDefinitions';
import { toast } from 'sonner';
import { Flame, Star, Loader2, ArrowRight, ArrowLeft, Send, AlertCircle, RefreshCw, UserX } from 'lucide-react';
import { MoodStep } from '@/components/checkin/MoodStep';
import { SupportStep } from '@/components/checkin/SupportStep';
import { CheckinSuccess } from '@/components/checkin/CheckinSuccess';

type Step = 'mood' | 'support';

export default function DailyCheckin() {
  const { t } = useTranslation();
  
  const { employee, isLoading: employeeLoading } = useCurrentEmployee();
  const tenantId = employee?.tenant_id || null;
  const { streak, totalPoints, calculatePoints } = useGamification(employee?.id || null);
  const { moods: moodDefinitions } = useMoodDefinitions(tenantId);

  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntry, isLoading: entryLoading } = useTodayEntry(employee?.id || null, today);

  const { submitCheckin, isSubmitting: submitting, error: submitError } = useCheckinSubmit();

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [supportActions, setSupportActions] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const moodDef = moodDefinitions?.find(m => m.key === selectedMood);
  const moodObj = moodDef ? { level: moodDef.key, score: moodDef.score } : null;
  const showSupport = selectedMood === 'struggling' || selectedMood === 'need_help';

  const steps: Step[] = ['mood', 'support'];
  const stepLabels: Record<string, string> = {
    mood: t('wellness.mood.title', 'Mood'),
    support: t('wellness.submitCheckin', 'Submit'),
  };

  const handleMoodSelected = (mood: string) => {
    setSelectedMood(mood);
    setTimeout(() => setStep('support'), 400);
  };

  const advanceFromMood = () => setStep('support');
  const goBack = () => { if (step === 'support') setStep('mood'); };
  const toggleSupportAction = (key: string) => {
    setSupportActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !employee || !moodObj) return;

    const result = await submitCheckin({
      tenantId: employee.tenant_id,
      employeeId: employee.id,
      userId: employee.user_id!,
      moodLevel: selectedMood,
      moodScore: moodObj.score,
      comment: comment || null,
      supportActions,
      answerValue: null,
      currentStreak: streak,
      entryDate: today,
      language: document.documentElement.lang || 'en',
    });

    if (result) {
      setAiTip(result.tip);
      setSubmitted(true);
      toast.success(t('common.pointsEarned', { points: result.pointsEarned, label: t('wellness.points') }));
    }
  };

  // Loading state
  if (employeeLoading || entryLoading) {
    return (
      <div className="container mx-auto max-w-md py-20 px-4 flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  // No employee profile
  if (!employee) {
    return (
      <div className="container mx-auto max-w-md py-16 px-4">
        <div className="text-center space-y-4 p-8 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5">
          <UserX className="h-12 w-12 mx-auto text-destructive/60" />
          <h2 className="text-lg font-semibold">{t('wellness.profileNotFound', 'Profile Not Found')}</h2>
          <p className="text-sm text-muted-foreground">{t('wellness.profileNotFoundDesc', 'Your employee profile could not be found. Please contact your administrator.')}</p>
        </div>
      </div>
    );
  }

  // Already checked in today
  if (todayEntry && !submitted) {
    return (
      <CheckinSuccess
        streak={todayEntry.streak_count || streak}
        totalPoints={totalPoints}
        aiTip={todayEntry.ai_tip}
        alreadyDone
      />
    );
  }

  // Post-submission success
  if (submitted) {
    return <CheckinSuccess streak={streak + 1} totalPoints={totalPoints + calculatePoints(streak)} aiTip={aiTip} />;
  }

  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="container mx-auto max-w-md py-8 px-4 space-y-8">
      {/* Header stats */}
      <div className="flex items-center justify-center gap-3">
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 rounded-full text-xs">
          <Flame className="h-3.5 w-3.5 text-orange-500" /> {streak} {t('wellness.dayStreak')}
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 rounded-full text-xs">
          <Star className="h-3.5 w-3.5 text-yellow-500" /> {totalPoints} {t('wellness.points')}
        </Badge>
      </div>

      {/* Segmented progress bar */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= currentStepIndex ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between px-1">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`text-[10px] font-medium transition-colors duration-300 ${
                i <= currentStepIndex ? 'text-primary' : 'text-muted-foreground/50'
              }`}
            >
              {stepLabels[s] || s}
            </span>
          ))}
        </div>
      </div>

      {/* Steps with animated transitions */}
      <div className="transition-all duration-300 ease-in-out">
        {step === 'mood' && (
          <div className="glass-card border-0 rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
            <MoodStep selectedMood={selectedMood} onSelect={handleMoodSelected} tenantId={tenantId} />
            {selectedMood && (
              <Button className="w-full rounded-xl h-12 text-base gap-2" onClick={advanceFromMood}>
                {t('common.next')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            )}
          </div>
        )}

        {step === 'support' && (
          <div className="glass-card border-0 rounded-xl p-6 space-y-6 animate-in fade-in slide-in-from-end-4 duration-300">
            <SupportStep showSupport={showSupport} supportActions={supportActions} onToggleAction={toggleSupportAction} comment={comment} onCommentChange={setComment} />

            {submitError && (
              <Alert variant="destructive" className="rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="text-sm">{submitError}</span>
                  <Button variant="ghost" size="sm" onClick={handleSubmit} className="gap-1 shrink-0">
                    <RefreshCw className="h-3 w-3" /> {t('common.retry', 'Retry')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 shrink-0" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <Button className="flex-1 rounded-xl h-12 text-base gap-2 font-semibold" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('wellness.submitCheckin')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
