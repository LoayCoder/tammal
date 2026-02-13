import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useDailyWellnessQuestions } from '@/hooks/useDailyWellnessQuestions';
import { useGamification } from '@/hooks/useGamification';
import { useCurrentEmployee } from '@/hooks/useCurrentEmployee';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Smile, Meh, Frown, AlertTriangle, Heart, Flame, Star, Wind, Phone, Coffee, Loader2 } from 'lucide-react';

const MOODS = [
  { level: 'great', score: 5, icon: Smile, color: 'text-green-500' },
  { level: 'good', score: 4, icon: Smile, color: 'text-emerald-400' },
  { level: 'okay', score: 3, icon: Meh, color: 'text-yellow-500' },
  { level: 'struggling', score: 2, icon: Frown, color: 'text-orange-500' },
  { level: 'need_help', score: 1, icon: AlertTriangle, color: 'text-red-500' },
] as const;

const SUPPORT_ACTIONS = [
  { key: 'meditation', icon: Heart },
  { key: 'breathing', icon: Wind },
  { key: 'talk', icon: Phone },
  { key: 'break', icon: Coffee },
] as const;

export default function DailyCheckin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { employee } = useCurrentEmployee();
  const tenantId = employee?.tenant_id || null;
  const { question, isLoading: questionLoading } = useDailyWellnessQuestions(tenantId);
  const { streak, totalPoints, calculatePoints } = useGamification(employee?.id || null);

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [answerValue, setAnswerValue] = useState<any>(null);
  const [answerText, setAnswerText] = useState('');
  const [supportActions, setSupportActions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiTip, setAiTip] = useState<string | null>(null);

  const moodObj = MOODS.find(m => m.level === selectedMood);
  const showSupport = selectedMood === 'struggling' || selectedMood === 'need_help';

  const toggleSupportAction = (key: string) => {
    setSupportActions(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !employee || !moodObj) return;
    setSubmitting(true);

    try {
      // 1. Generate AI tip
      let tip = '';
      try {
        const { data } = await supabase.functions.invoke('generate-daily-tip', {
          body: {
            moodLevel: selectedMood,
            questionText: question?.question_text || '',
            answerValue,
            language: document.documentElement.lang || 'en',
          },
        });
        tip = data?.tip || '';
      } catch { /* tip is optional */ }

      // 2. Calculate points
      const points = calculatePoints(streak);

      // 3. Insert mood entry
      const { error } = await supabase
        .from('mood_entries' as any)
        .insert({
          tenant_id: employee.tenant_id,
          employee_id: employee.id,
          mood_level: selectedMood,
          mood_score: moodObj.score,
          question_id: question?.question_id || null,
          answer_value: answerValue,
          answer_text: answerText || null,
          ai_tip: tip || null,
          support_actions: supportActions,
          points_earned: points,
          streak_count: streak + 1,
          entry_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      setAiTip(tip);
      setSubmitted(true);
      toast({ title: `🎉 +${points} ${t('wellness.points')}!` });
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto max-w-lg py-8 px-4 space-y-6">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-bold">{t('wellness.thankYou')}</h2>
            <div className="flex justify-center gap-4">
              <Badge variant="secondary" className="text-base px-3 py-1">
                <Flame className="h-4 w-4 me-1" /> {streak + 1} {t('wellness.dayStreak')}
              </Badge>
              <Badge variant="secondary" className="text-base px-3 py-1">
                <Star className="h-4 w-4 me-1" /> {totalPoints + calculatePoints(streak)} {t('wellness.points')}
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

  return (
    <div className="container mx-auto max-w-lg py-8 px-4 space-y-6">
      {/* Streak bar */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="gap-1">
          <Flame className="h-3 w-3" /> {streak} {t('wellness.dayStreak')}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Star className="h-3 w-3" /> {totalPoints} {t('wellness.points')}
        </Badge>
      </div>

      {/* Mood selector */}
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
                  onClick={() => setSelectedMood(mood.level)}
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

      {/* Daily question */}
      {selectedMood && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('wellness.dailyQuestion')}</CardTitle>
          </CardHeader>
          <CardContent>
            {questionLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : question ? (
              <div className="space-y-4">
                <p className="font-medium">{question.question_text}</p>
                {question.question_type === 'scale' && (
                  <div className="space-y-2">
                    <Slider
                      min={1} max={10} step={1}
                      defaultValue={[5]}
                      onValueChange={v => setAnswerValue(v[0])}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span><span>10</span>
                    </div>
                  </div>
                )}
                {question.question_type === 'multiple_choice' && question.options.length > 0 && (
                  <RadioGroup onValueChange={v => setAnswerValue(v)}>
                    {question.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <RadioGroupItem value={opt} id={`opt-${i}`} />
                        <Label htmlFor={`opt-${i}`}>{opt}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                {question.question_type === 'text' && (
                  <Textarea
                    value={typeof answerValue === 'string' ? answerValue : ''}
                    onChange={e => setAnswerValue(e.target.value)}
                    placeholder={t('wellness.typeAnswer')}
                  />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('wellness.noQuestion')}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Support actions */}
      {showSupport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('wellness.supportActions')}</CardTitle>
            <CardDescription>{t('wellness.supportDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORT_ACTIONS.map(action => {
                const Icon = action.icon;
                const isActive = supportActions.includes(action.key);
                return (
                  <button
                    key={action.key}
                    onClick={() => toggleSupportAction(action.key)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-start ${
                      isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm">{t(`wellness.support.${action.key}`)}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optional comment */}
      {selectedMood && (
        <Card>
          <CardContent className="pt-4">
            <Textarea
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
              placeholder={t('wellness.addComment')}
              rows={2}
            />
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {selectedMood && (
        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
          {t('wellness.submitCheckin')}
        </Button>
      )}
    </div>
  );
}
