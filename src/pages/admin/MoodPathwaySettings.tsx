import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Save, Info, RotateCcw } from 'lucide-react';
import { useMoodQuestionConfig, type MoodQuestionConfig } from '@/hooks/useMoodQuestionConfig';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';

const MOOD_META: Record<
  string,
  { emoji: string; label: string; label_ar: string; color: string; themes: string[] }
> = {
  great: {
    emoji: '😄',
    label: 'Great',
    label_ar: 'ممتاز',
    color: 'text-chart-1',
    themes: ['positive_drivers', 'recognition', 'team_connection', 'energy_source', 'purpose_alignment', 'momentum_building'],
  },
  good: {
    emoji: '🙂',
    label: 'Good',
    label_ar: 'جيد',
    color: 'text-chart-2',
    themes: ['engagement', 'collaboration', 'satisfaction', 'progress', 'growth', 'energy_level'],
  },
  okay: {
    emoji: '😐',
    label: 'Okay',
    label_ar: 'عادي',
    color: 'text-chart-4',
    themes: ['minor_friction', 'workload_balance', 'focus_clarity', 'emotional_energy', 'support_access'],
  },
  struggling: {
    emoji: '😟',
    label: 'Struggling',
    label_ar: 'أعاني',
    color: 'text-destructive',
    themes: ['stressors', 'burnout_signals', 'work_life_spillover', 'communication_gaps', 'support_needs', 'work_pressure'],
  },
  need_help: {
    emoji: '😢',
    label: 'Need Help',
    label_ar: 'بحاجة للمساعدة',
    color: 'text-destructive',
    themes: ['immediate_stress_source', 'support_preference', 'human_connection', 'safety_support'],
  },
};

const THEME_DISPLAY: Record<string, string> = {
  positive_drivers: 'Positive Drivers', recognition: 'Recognition',
  team_connection: 'Team Connection', energy_source: 'Energy Source',
  purpose_alignment: 'Purpose Alignment', momentum_building: 'Momentum Building',
  engagement: 'Engagement', collaboration: 'Collaboration',
  satisfaction: 'Satisfaction', progress: 'Progress',
  growth: 'Growth', energy_level: 'Energy Level',
  minor_friction: 'Minor Friction', workload_balance: 'Workload Balance',
  focus_clarity: 'Focus Clarity', emotional_energy: 'Emotional Energy',
  support_access: 'Support Access', stressors: 'Stressors',
  burnout_signals: 'Burnout Signals', work_life_spillover: 'Work-Life Spillover',
  communication_gaps: 'Communication Gaps', support_needs: 'Support Needs',
  work_pressure: 'Work Pressure', immediate_stress_source: 'Immediate Stress Source',
  support_preference: 'Support Preference', human_connection: 'Human Connection',
  safety_support: 'Safety Support',
};

export default function MoodPathwaySettings() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { isSuperAdmin } = useUserPermissions();

  const [tenantId, setTenantId] = useState<string | null>(null);
  const [localConfigs, setLocalConfigs] = useState<Record<string, MoodQuestionConfig>>({});
  const [savingMood, setSavingMood] = useState<string | null>(null);

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
      [moodLevel]: {
        ...prev[moodLevel],
        tenant_id: tenantId!,
        mood_level: moodLevel,
        [field]: value,
      },
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

  const MOOD_ORDER = ['great', 'good', 'okay', 'struggling', 'need_help'];

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
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{t('moodPathway.themeRotation', { count: 6 })}</p>
          <p className="text-xs">{t('moodPathway.extremeMoodOnly')}</p>
        </div>
      </div>

      {/* Mood Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
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

            return (
              <Card key={moodLevel} className="overflow-hidden">
                {/* Card header row */}
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{meta.emoji}</span>
                      <div>
                        <CardTitle className={`text-base ${meta.color}`}>
                          {moodLabel}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {t('moodPathway.themeRotation', { count: meta.themes.length })}
                        </CardDescription>
                      </div>
                    </div>
                    {/* Theme badges */}
                    <div className="hidden sm:flex flex-wrap gap-1 max-w-xs justify-end">
                      {meta.themes.slice(0, 3).map(theme => (
                        <Badge key={theme} variant="outline" className="text-[10px] px-1.5 py-0">
                          {THEME_DISPLAY[theme] || theme}
                        </Badge>
                      ))}
                      {meta.themes.length > 3 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          +{meta.themes.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Enable AI questions toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">
                        {t('moodPathway.enablePathway')}
                      </Label>
                    </div>
                    <Switch
                      checked={config.is_enabled}
                      onCheckedChange={v => updateLocal(moodLevel, 'is_enabled', v)}
                    />
                  </div>

                  {/* Enable free-text (only for extreme moods) */}
                  {isExtreme && (
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">
                          {t('moodPathway.enableFreeText')}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t('moodPathway.extremeMoodOnly')}
                        </p>
                      </div>
                      <Switch
                        checked={config.enable_free_text}
                        onCheckedChange={v => updateLocal(moodLevel, 'enable_free_text', v)}
                        disabled={!config.is_enabled}
                      />
                    </div>
                  )}

                  {/* Custom AI context hint */}
                  {config.is_enabled && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        {t('moodPathway.customContext')}
                      </Label>
                      <Textarea
                        value={config.custom_prompt_context || ''}
                        onChange={e => updateLocal(moodLevel, 'custom_prompt_context', e.target.value || null)}
                        placeholder={t('moodPathway.customContextPlaceholder')}
                        rows={2}
                        className="resize-none text-sm rounded-xl"
                        dir="auto"
                      />
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
                      {isSaving ? (
                        <RotateCcw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3" />
                      )}
                      {t('moodPathway.saveSettings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
