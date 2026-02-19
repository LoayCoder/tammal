import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Save, RotateCcw, Link2, Plus, X, Info, Edit2, ChevronUp, ChevronDown, Trash2, Settings2 } from 'lucide-react';
import { useMoodQuestionConfig, type MoodQuestionConfig } from '@/hooks/useMoodQuestionConfig';
import { useMoodDefinitions, type MoodDefinition } from '@/hooks/useMoodDefinitions';
import { useQuestions } from '@/hooks/useQuestions';
import { supabase } from '@/integrations/supabase/client';
import { MoodQuestionPickerDialog } from '@/components/checkin/MoodQuestionPickerDialog';
import { MoodDefinitionDialog } from '@/components/mood/MoodDefinitionDialog';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MoodPathwaySettings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Record<string, MoodQuestionConfig>>({});
  const [savingMood, setSavingMood] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [savingTags, setSavingTags] = useState(false);
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [editingMood, setEditingMood] = useState<MoodDefinition | null>(null);
  const [deletingMood, setDeletingMood] = useState<MoodDefinition | null>(null);

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

  const { configs, isLoading: configsLoading, upsertConfig } = useMoodQuestionConfig(tenantId);
  const { moods, isLoading: moodsLoading, upsertMood, deleteMood, toggleMood, reorderMoods } = useMoodDefinitions(tenantId);
  const { questions } = useQuestions();

  const isLoading = configsLoading || moodsLoading;

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

  const getTaggedQuestions = (moodLevel: string) => {
    return questions.filter(q => {
      const levels = (q as any).mood_levels;
      return Array.isArray(levels) && levels.includes(moodLevel);
    });
  };

  const handleSaveTags = async (selectedIds: string[], moodLevel: string) => {
    setSavingTags(true);
    try {
      const wasTagged = getTaggedQuestions(moodLevel).map(q => q.id);
      const toUntag = wasTagged.filter(id => !selectedIds.includes(id));
      const toTag = selectedIds.filter(id => !wasTagged.includes(id));

      for (const id of toUntag) {
        const q = questions.find(q => q.id === id);
        if (!q) continue;
        const current = ((q as any).mood_levels || []) as string[];
        const updated = current.filter((l: string) => l !== moodLevel);
        await supabase.from('questions').update({ mood_levels: updated } as any).eq('id', id);
      }

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

  const handleMoodDialogSave = (data: Partial<MoodDefinition>) => {
    if (!tenantId) return;
    const nextOrder = editingMood ? editingMood.sort_order : moods.length;
    upsertMood.mutate({
      ...data,
      tenant_id: tenantId,
      key: data.key!,
      sort_order: data.sort_order ?? nextOrder,
      is_active: data.is_active ?? true,
      is_default: data.is_default ?? false,
    } as any, {
      onSuccess: () => {
        setMoodDialogOpen(false);
        setEditingMood(null);
      },
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const ordered = [...moods];
    [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
    reorderMoods.mutate(ordered.map(m => m.id));
  };

  const handleMoveDown = (index: number) => {
    if (index >= moods.length - 1) return;
    const ordered = [...moods];
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    reorderMoods.mutate(ordered.map(m => m.id));
  };

  const handleDeleteMood = () => {
    if (!deletingMood) return;
    deleteMood.mutate(deletingMood.id, {
      onSettled: () => setDeletingMood(null),
    });
  };

  const canDeleteMood = moods.length > 2;

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

      {/* ==================== Mood Definitions Management ==================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">{t('moodPathway.manageMoods')}</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {t('moodPathway.manageMoodsDesc')}
                </CardDescription>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { setEditingMood(null); setMoodDialogOpen(true); }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('moodPathway.addMood')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {moodsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : moods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('common.noData')}
            </p>
          ) : (
            <div className="space-y-2">
              {moods.map((mood, index) => {
                const label = isRTL ? mood.label_ar : mood.label_en;
                return (
                  <div
                    key={mood.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      mood.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === moods.length - 1}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Emoji & label */}
                    <span className="text-2xl">{mood.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${mood.color}`}>{label}</span>
                        {mood.is_default && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {t('moodPathway.defaultMoodBadge')}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{mood.key} • {t('moodPathway.score')}: {mood.score}</span>
                    </div>

                    {/* Toggle active */}
                    <Switch
                      checked={mood.is_active}
                      onCheckedChange={v => toggleMood.mutate({ id: mood.id, is_active: v })}
                    />

                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingMood(mood); setMoodDialogOpen(true); }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeletingMood(mood)}
                      disabled={!canDeleteMood}
                      title={!canDeleteMood ? t('moodPathway.minMoodsRequired') : undefined}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== Per-Mood Pathway Cards ==================== */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {moods.filter(m => m.is_active).map(moodDef => {
            const moodLevel = moodDef.key;
            const config = localConfigs[moodLevel];
            const moodLabel = isRTL ? moodDef.label_ar : moodDef.label_en;
            const isSaving = savingMood === moodLevel;
            const taggedQuestions = getTaggedQuestions(moodLevel);

            return (
              <Card key={moodDef.id} className="overflow-hidden">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{moodDef.emoji}</span>
                      <div>
                        <CardTitle className={`text-base ${moodDef.color}`}>{moodLabel}</CardTitle>
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
                      checked={config?.is_enabled ?? true}
                      onCheckedChange={v => updateLocal(moodLevel, 'is_enabled', v)}
                    />
                  </div>

                  {/* Enable free-text */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{t('moodPathway.enableFreeText')}</Label>
                    </div>
                    <Switch
                      checked={config?.enable_free_text ?? false}
                      onCheckedChange={v => updateLocal(moodLevel, 'enable_free_text', v)}
                      disabled={!(config?.is_enabled ?? true)}
                    />
                  </div>

                  {/* Linked questions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('moodPathway.linkedQuestions')}</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setPickerOpen(moodLevel)}
                        disabled={!(config?.is_enabled ?? true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('moodPathway.browseQuestions')}
                      </Button>
                    </div>

                    {taggedQuestions.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-4 text-center">
                        <Link2 className="h-4 w-4 text-muted-foreground inline-block mb-1" />
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
                  {(config?.is_enabled ?? true) && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('moodPathway.aiRecommendationHint')}</Label>
                      <Textarea
                        value={config?.custom_prompt_context || ''}
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

      {/* Mood definition dialog */}
      <MoodDefinitionDialog
        open={moodDialogOpen}
        onOpenChange={open => { if (!open) { setMoodDialogOpen(false); setEditingMood(null); } else setMoodDialogOpen(true); }}
        mood={editingMood}
        onSave={handleMoodDialogSave}
        isSaving={upsertMood.isPending}
        existingKeys={moods.map(m => m.key)}
        existingMoods={moods}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingMood} onOpenChange={open => { if (!open) setDeletingMood(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('moodPathway.deleteMoodConfirm')}
              {deletingMood?.is_default && (
                <span className="block mt-2 font-medium text-destructive">
                  {t('moodPathway.deletingDefaultWarning')}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMood}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
