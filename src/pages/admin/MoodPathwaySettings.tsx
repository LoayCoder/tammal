import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Save, RotateCcw, Link2, Plus, X, Info } from 'lucide-react';
import { useMoodQuestionConfig, type MoodQuestionConfig } from '@/hooks/useMoodQuestionConfig';
import { useQuestions } from '@/hooks/useQuestions';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { MoodQuestionPickerDialog } from '@/components/checkin/MoodQuestionPickerDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const MOOD_META: Record<string, { emoji: string; label: string; label_ar: string; color: string }> = {
  great: { emoji: '😄', label: 'Great', label_ar: 'ممتاز', color: 'text-chart-1' },
  good: { emoji: '🙂', label: 'Good', label_ar: 'جيد', color: 'text-chart-2' },
  okay: { emoji: '😐', label: 'Okay', label_ar: 'عادي', color: 'text-chart-4' },
  struggling: { emoji: '😟', label: 'Struggling', label_ar: 'أعاني', color: 'text-destructive' },
  need_help: { emoji: '😢', label: 'Need Help', label_ar: 'بحاجة للمساعدة', color: 'text-destructive' },
};

const MOOD_ORDER = ['great', 'good', 'okay', 'struggling', 'need_help'];

export default function MoodPathwaySettings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Record<string, MoodQuestionConfig>>({});
  const [savingMood, setSavingMood] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [savingTags, setSavingTags] = useState(false);

  // Fetch tenant id
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => {
          if (profile?.tenant_id) setTenantId(profile.tenant_id);
        });
    });
  }, []);

  const { configs, isLoading, upsertConfig } = useMoodQuestionConfig(tenantId);
  const { questions } = useQuestions();

  // Sync fetched configs into local state
  useEffect(() => {
    if (!configs.length) return;
    const map: Record<string, MoodQuestionConfig> = {};
    configs.forEach(c => { map[c.mood_level] = { ...c }; });
    setLocalConfigs(map);
  }, [configs]);

  const updateLocal = (moodLevel: string, field: keyof MoodQuestionConfig, value: any) => {
    setLocalConfigs(prev => ({
      ...prev,
      [moodLevel]: { ...prev[moodLevel], tenant_id: tenantId!, mood_level: moodLevel, [field]: value },
    }));
  };

  const handleSave = async (moodLevel: string) => {
    const config = localConfigs[moodLevel];
    if (!config || !tenantId) return;
    setSavingMood(moodLevel);
    try {
      await upsertConfig.mutateAsync({ ...config, tenant_id: tenantId });
    } finally {
      setSavingMood(null);
    }
  };

  // Helper: get questions tagged for a mood level
  const getTaggedQuestions = (moodLevel: string) => {
    return questions.filter(q => {
      const levels = (q as any).mood_levels;
      return Array.isArray(levels) && levels.includes(moodLevel);
    });
  };

  // Bulk-update mood_levels tags on questions
  const handleSaveTags = async (selectedIds: string[], moodLevel: string) => {
    setSavingTags(true);
    try {
      // Questions that were tagged but now untagged
      const wasTagged = getTaggedQuestions(moodLevel).map(q => q.id);
      const toUntag = wasTagged.filter(id => !selectedIds.includes(id));
      const toTag = selectedIds.filter(id => !wasTagged.includes(id));

      // Untag: remove moodLevel from their mood_levels array
      for (const id of toUntag) {
        const q = questions.find(q => q.id === id);
        if (!q) continue;
        const current = ((q as any).mood_levels || []) as string[];
        const updated = current.filter((l: string) => l !== moodLevel);
        await supabase.from('questions').update({ mood_levels: updated } as any).eq('id', id);
      }

      // Tag: add moodLevel to their mood_levels array
      for (const id of toTag) {
        const q = questions.find(q => q.id === id);
        if (!q) continue;
        const current = ((q as any).mood_levels || []) as string[];
        if (!current.includes(moodLevel)) {
          await supabase.from('questions').update({ mood_levels: [...current, moodLevel] } as any).eq('id', id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['mood-pathway-questions'] });
      toast.success(t('moodPathway.tagsSaved'));
    } catch {
      toast.error(t('moodPathway.tagsFailed'));
    } finally {
      setSavingTags(false);
    }
  };

  // Unlink a single question from a mood
  const handleUnlinkQuestion = async (questionId: string, moodLevel: string) => {
    const q = questions.find(q => q.id === questionId);
    if (!q) return;
    const current = ((q as any).mood_levels || []) as string[];
    const updated = current.filter((l: string) => l !== moodLevel);
    await supabase.from('questions').update({ mood_levels: updated } as any).eq('id', questionId);
    queryClient.invalidateQueries({ queryKey: ['questions'] });
    queryClient.invalidateQueries({ queryKey: ['mood-pathway-questions'] });
    toast.success(t('moodPathway.questionUnlinked'));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('moodPathway.settingsTitle')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('moodPathway.settingsDesc')}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">{t('moodPathway.settingsInfo')}</p>
      </div>

      {/* Mood Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {MOOD_ORDER.map(moodLevel => {
            const meta = MOOD_META[moodLevel];
            const config = localConfigs[moodLevel];
            if (!meta || !config) return null;

            const moodLabel = isRTL ? meta.label_ar : meta.label;
            const isExtreme = moodLevel === 'great' || moodLevel === 'need_help';
            const isSaving = savingMood === moodLevel;
            const taggedQuestions = getTaggedQuestions(moodLevel);

            return (
              <Card key={moodLevel} className="overflow-hidden">
                {/* Card header */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <CardTitle className={`text-base ${meta.color}`}>{moodLabel}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {t('moodPathway.linkedQuestionsCount', { count: taggedQuestions.length })}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Enable toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{t('moodPathway.enablePathway')}</Label>
                    <Switch
                      checked={config.is_enabled}
                      onCheckedChange={v => updateLocal(moodLevel, 'is_enabled', v)}
                    />
                  </div>

                  {/* Enable free-text (extreme moods only) */}
                  {isExtreme && (
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">{t('moodPathway.enableFreeText')}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('moodPathway.extremeMoodOnly')}</p>
                      </div>
                      <Switch
                        checked={config.enable_free_text}
                        onCheckedChange={v => updateLocal(moodLevel, 'enable_free_text', v)}
                        disabled={!config.is_enabled}
                      />
                    </div>
                  )}

                  {/* Linked questions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('moodPathway.linkedQuestions')}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setPickerOpen(moodLevel)}
                        disabled={!config.is_enabled}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('moodPathway.browseQuestions')}
                      </Button>
                    </div>

                    {taggedQuestions.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center">
                        <Link2 className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">{t('moodPathway.noLinkedQuestions')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {taggedQuestions.map(q => {
                          const text = isRTL && q.text_ar ? q.text_ar : q.text;
                          return (
                            <div key={q.id} className="flex items-start gap-2 rounded-lg border bg-muted/30 p-2.5">
                              <p className="text-sm flex-1 line-clamp-2" dir="auto">{text}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => handleUnlinkQuestion(q.id, moodLevel)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* AI Recommendation Hint */}
                  {config.is_enabled && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('moodPathway.aiRecommendationHint')}</Label>
                      <Textarea
                        value={config.custom_prompt_context || ''}
                        onChange={e => updateLocal(moodLevel, 'custom_prompt_context', e.target.value || null)}
                        placeholder={t('moodPathway.aiRecommendationHintPlaceholder')}
                        rows={2}
                        className="resize-none text-sm rounded-xl"
                        dir="auto"
                      />
                      <p className="text-xs text-muted-foreground">{t('moodPathway.aiRecommendationHintDesc')}</p>
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleSave(moodLevel)}
                      disabled={isSaving}
                      className="gap-1.5 h-8 px-4 rounded-lg text-xs"
                    >
                      {isSaving ? <RotateCcw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      {t('moodPathway.saveSettings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Question picker dialog */}
      {pickerOpen && (
        <MoodQuestionPickerDialog
          open={!!pickerOpen}
          onOpenChange={open => { if (!open) setPickerOpen(null); }}
          moodLevel={pickerOpen}
          onSave={handleSaveTags}
          isSaving={savingTags}
        />
      )}
    </div>
  );
}
