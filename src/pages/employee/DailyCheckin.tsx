import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGamification } from '@/hooks/useGamification';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Flame, Star, Loader2, ArrowRight, ArrowLeft, Send, AlertCircle, RefreshCw, UserX } from 'lucide-react';
import { MoodStep } from '@/components/checkin/MoodStep';
import { useMoodDefinitions } from '@/hooks/useMoodDefinitions';
import { SupportStep } from '@/components/checkin/SupportStep';
import { CheckinSuccess } from '@/components/checkin/CheckinSuccess';

type Step = 'mood' | 'support';

export default function DailyCheckin() {
  const { t } = useTranslation();
  
  const queryClient = useQueryClient();
  const { employee, isLoading: employeeLoading } = useCurrentEmployee();
  const tenantId = employee?.tenant_id || null;
  const { streak, totalPoints, calculatePoints } = useGamification(employee?.id || null);

  const { moods: moodDefinitions } = useMoodDefinitions(tenantId);

  // --- Guard: check if already checked in today ---
  const today = new Date().toISOString().split('T')[0];
  const { data: todayEntry, isLoading: entryLoading } = useQuery({
    queryKey: ['mood-entry-today', employee?.id, today],
    queryFn: async () => {
      if (!employee?.id) return null;
      const { data } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('entry_date', today)
        .maybeSingle();
      return data;
    },
    enabled: !!employee?.id,
  });

  const [step, setStep] = useState<Step>('mood');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [supportActions, setSupportActions] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const goBack = () => {
    if (step === 'support') setStep('mood');
  };

  const toggleSupportAction = (key: string) => {
    setSupportActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !employee || !moodObj) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let tip = '';
      try {
        const { data } = await supabase.functions.invoke('generate-daily-tip', {
          body: { moodLevel: selectedMood, pathwayAnswers: [], language: document.documentElement.lang || 'en' },
        });
        tip = data?.tip || '';
      } catch { /* tip is optional */ }

      const points = calculatePoints(streak);

      const { error: moodError } = await supabase
        .from('mood_entries' as any)
        .insert({
          tenant_id: employee.tenant_id, employee_id: employee.id, mood_level: selectedMood, mood_score: moodObj.score,
          answer_value: null, answer_text: comment || null,
          ai_tip: tip || null, support_actions: supportActions, points_earned: points, streak_count: streak + 1,
          entry_date: today,
        });
      if (moodError) throw moodError;

      // Bridge check-in points into the recognition points ledger
      const { error: ptError } = await supabase
        .from('points_transactions')
        .insert({
          user_id: employee.user_id!,
          tenant_id: employee.tenant_id,
          amount: points,
          source_type: 'daily_checkin',
          status: 'credited',
          description: `Daily check-in streak reward`,
        });
      if (ptError) console.warn('Points ledger insert failed:', ptError.message);

      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['mood-entry-today'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });

      setAiTip(tip);
      setSubmitted(true);
      toast.success(`🎉 +${points} ${t('wellness.points')}!`);
    } catch (err: any) {
      setSubmitError(err.message || t('common.error'));
      toast.error(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
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
            <MoodStep selectedMood={selectedMood} onSelect={handleMoodSelected} />
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
