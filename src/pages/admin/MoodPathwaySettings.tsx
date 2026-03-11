import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Info } from 'lucide-react';
import { useMoodQuestionConfig, type MoodQuestionConfig } from '@/hooks/wellness/useMoodQuestionConfig';
import { useMoodDefinitions, type MoodDefinition } from '@/hooks/wellness/useMoodDefinitions';
import { useQuestions } from '@/hooks/questions/useQuestions';
import { useMoodTagging } from '@/hooks/admin/useMoodTagging';
import { useTenantId } from '@/hooks/org/useTenantId';
import { MoodQuestionPickerDialog } from '@/components/checkin/MoodQuestionPickerDialog';
import { MoodDefinitionDialog } from '@/components/mood/MoodDefinitionDialog';
import { MoodDefinitionManager } from '@/components/mood/settings/MoodDefinitionManager';
import { MoodConfigCard } from '@/components/mood/settings/MoodConfigCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MoodPathwaySettings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { tenantId } = useTenantId();

  const [localConfigs, setLocalConfigs] = useState<Record<string, MoodQuestionConfig>>({});
  const [savingMood, setSavingMood] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [moodDialogOpen, setMoodDialogOpen] = useState(false);
  const [editingMood, setEditingMood] = useState<MoodDefinition | null>(null);
  const [deletingMood, setDeletingMood] = useState<MoodDefinition | null>(null);

  const { configs, isPending: configsLoading, upsertConfig } = useMoodQuestionConfig(tenantId);
  const { moods, isPending: moodsLoading, upsertMood, deleteMood, toggleMood, reorderMoods } = useMoodDefinitions(tenantId);
  const { questions } = useQuestions();
  const { getTaggedQuestions, saveTags, unlinkQuestion, isSaving: savingTags } = useMoodTagging(questions);
  const isLoading = configsLoading || moodsLoading;

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
    try { await upsertConfig.mutateAsync({ ...config, tenant_id: tenantId }); }
    finally { setSavingMood(null); }
  };

  const handleMoodDialogSave = (data: Partial<MoodDefinition>) => {
    if (!tenantId) return;
    const nextOrder = editingMood ? editingMood.sort_order : moods.length;
    upsertMood.mutate({
      ...data, tenant_id: tenantId, key: data.key!,
      sort_order: data.sort_order ?? nextOrder,
      is_active: data.is_active ?? true, is_default: data.is_default ?? false,
    } as any, {
      onSuccess: () => { setMoodDialogOpen(false); setEditingMood(null); },
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
    deleteMood.mutate(deletingMood.id, { onSettled: () => setDeletingMood(null) });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('moodPathway.settingsTitle')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('moodPathway.settingsDesc')}</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="glass-card border-0 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">{t('moodPathway.settingsInfo')}</p>
      </div>

      {/* Mood Definitions Management */}
      <MoodDefinitionManager
        moods={moods}
        isLoading={moodsLoading}
        isRTL={isRTL}
        canDelete={moods.length > 2}
        onAdd={() => { setEditingMood(null); setMoodDialogOpen(true); }}
        onEdit={(mood) => { setEditingMood(mood); setMoodDialogOpen(true); }}
        onDelete={setDeletingMood}
        onToggle={(id, v) => toggleMood.mutate({ id, is_active: v })}
        onMoveUp={handleMoveUp}
        onMoveDown={handleMoveDown}
      />

      {/* Per-Mood Pathway Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {moods.filter(m => m.is_active).map(moodDef => (
            <MoodConfigCard
              key={moodDef.id}
              moodDef={moodDef}
              config={localConfigs[moodDef.key]}
              taggedQuestions={getTaggedQuestions(moodDef.key)}
              isRTL={isRTL}
              isSaving={savingMood === moodDef.key}
              onUpdateField={updateLocal}
              onSave={handleSave}
              onOpenPicker={setPickerOpen}
              onUnlinkQuestion={unlinkQuestion}
            />
          ))}
        </div>
      )}

      {/* Question picker dialog */}
      {pickerOpen && (
        <MoodQuestionPickerDialog
          open={!!pickerOpen}
          onOpenChange={open => { if (!open) setPickerOpen(null); }}
          moodLevel={pickerOpen}
          onSave={saveTags}
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
                <span className="block mt-2 font-medium text-destructive">{t('moodPathway.deletingDefaultWarning')}</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMood} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
