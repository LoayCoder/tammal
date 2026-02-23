import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface MoodQuestionConfig {
  id?: string;
  tenant_id: string;
  mood_level: string;
  is_enabled: boolean;
  enable_free_text: boolean;
  custom_prompt_context: string | null;
  max_questions: number;
  is_custom_override: boolean;
}

const MOOD_LEVELS = ['great', 'good', 'okay', 'struggling', 'need_help'];

const DEFAULT_CONFIGS: Omit<MoodQuestionConfig, 'tenant_id'>[] = MOOD_LEVELS.map(level => ({
  mood_level: level,
  is_enabled: true,
  enable_free_text: level === 'great' || level === 'need_help',
  custom_prompt_context: null,
  max_questions: 2,
  is_custom_override: false,
}));

export function useMoodQuestionConfig(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: configs, isLoading } = useQuery({
    queryKey: ['mood-question-configs', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const { data, error } = await supabase
        .from('mood_question_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('mood_level');

      if (error) throw error;

      // Merge fetched configs with defaults (fill in any missing mood levels)
      const fetched = ((data || []) as unknown) as MoodQuestionConfig[];
      return MOOD_LEVELS.map(level => {
        const found = fetched.find(c => c.mood_level === level);
      return found || {
          tenant_id: tenantId,
          mood_level: level,
          is_enabled: true,
          enable_free_text: level === 'great' || level === 'need_help',
          custom_prompt_context: null,
          max_questions: 2,
          is_custom_override: false,
        } as MoodQuestionConfig;
      });
    },
    enabled: !!tenantId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (config: MoodQuestionConfig) => {
      const { error } = await supabase
        .from('mood_question_configs')
        .upsert(
          {
            tenant_id: config.tenant_id,
            mood_level: config.mood_level,
            is_enabled: config.is_enabled,
            enable_free_text: config.enable_free_text,
            custom_prompt_context: config.custom_prompt_context,
            max_questions: config.max_questions,
            is_custom_override: config.is_custom_override,
          },
          { onConflict: 'tenant_id,mood_level' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-question-configs', tenantId] });
      toast({ title: t('moodPathway.settingsSaved') });
    },
    onError: () => {
      toast({ title: t('moodPathway.settingsFailed'), variant: 'destructive' });
    },
  });

  const batchUpsertConfigs = useMutation({
    mutationFn: async (configList: MoodQuestionConfig[]) => {
      const rows = configList.map(config => ({
        tenant_id: config.tenant_id,
        mood_level: config.mood_level,
        is_enabled: config.is_enabled,
        enable_free_text: config.enable_free_text,
        custom_prompt_context: config.custom_prompt_context,
        max_questions: config.max_questions,
        is_custom_override: config.is_custom_override,
      }));
      const { error } = await supabase
        .from('mood_question_configs')
        .upsert(rows, { onConflict: 'tenant_id,mood_level' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-question-configs', tenantId] });
    },
    onError: () => {
      toast({ title: t('moodPathway.settingsFailed'), variant: 'destructive' });
    },
  });

  return { configs: configs || [], isLoading, upsertConfig, batchUpsertConfigs };
}
