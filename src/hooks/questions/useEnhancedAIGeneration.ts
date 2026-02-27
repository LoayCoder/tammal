import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface EnhancedGeneratedQuestion {
  question_text: string;
  question_text_ar: string;
  type: string;
  complexity: string;
  tone: string;
  explanation: string;
  confidence_score: number;
  bias_flag: boolean;
  ambiguity_flag: boolean;
  validation_status: 'pending' | 'passed' | 'warning' | 'failed';
  validation_details: Record<string, any>;
  options?: { text: string; text_ar: string }[];
  framework_reference?: string | null;
  psychological_construct?: string | null;
  scoring_mechanism?: string | null;
  category_name?: string | null;
  subcategory_name?: string | null;
  mood_levels: string[];
  // Analytical fields
  category_id?: string | null;
  subcategory_id?: string | null;
  mood_score?: number;
  affective_state?: string;
  generation_period_id?: string | null;
  question_hash?: string;
}

export interface ValidationReport {
  overall_result: 'passed' | 'warning' | 'failed';
  validation_results: Record<string, { result: string; details: any }>;
  per_question: { validation_status: string; validation_details: Record<string, any> }[];
  avg_confidence: number;
  critic_result?: any;
}

export interface AdvancedSettings {
  requireExplanation: boolean;
  enableBiasDetection: boolean;
  enableAmbiguityDetection: boolean;
  enableDuplicateDetection: boolean;
  enableCriticPass: boolean;
  minWordLength: number;
}

export interface GenerateInput {
  questionCount: number;
  complexity: string;
  tone: string;
  questionType: string;
  model: string;
  accuracyMode: string;
  advancedSettings: AdvancedSettings;
  language?: string;
  useExpertKnowledge?: boolean;
  knowledgeDocumentIds?: string[];
  customPrompt?: string;
  selectedFrameworks?: string[];
  categoryIds?: string[];
  subcategoryIds?: string[];
  moodLevels?: string[];
  periodId?: string;
}



import { VALID_QUESTION_TYPES } from '@/config/constants';
const VALID_TYPES = VALID_QUESTION_TYPES as readonly string[];

function normalizeQuestionType(t: string): string {
  if (VALID_TYPES.includes(t)) return t;
  const lower = (t || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (lower.includes('open') || lower.includes('free_text') || lower.includes('qualitative')) return 'open_ended';
  if (lower.includes('scenario') || lower.includes('situational')) return 'multiple_choice';
  if (lower.includes('likert') || lower.includes('agreement')) return 'likert_5';
  if (lower.includes('numeric') || lower.includes('scale') || lower.includes('rating')) return 'numeric_scale';
  if (lower.includes('yes') || lower.includes('binary')) return 'yes_no';
  if (lower.includes('multiple') || lower.includes('mcq') || lower.includes('choice')) return 'multiple_choice';
  return 'likert_5';
}

export function useEnhancedAIGeneration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<EnhancedGeneratedQuestion[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [generationMeta, setGenerationMeta] = useState<{ model: string; duration_ms: number } | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const lastMoodLevelsRef = { current: [] as string[] };
  const replaceAtIndexRef = { current: null as number | null };

  const generateMutation = useMutation({
    mutationFn: async (input: GenerateInput & { _replaceAtIndex?: number }) => {
      lastMoodLevelsRef.current = input.moodLevels || [];
      replaceAtIndexRef.current = input._replaceAtIndex ?? null;
      const { _replaceAtIndex, ...body } = input;
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const defaultMoods = lastMoodLevelsRef.current;
      const normalized = (data.questions || []).map((q: any) => ({
        ...q,
        type: normalizeQuestionType(q.type),
        mood_levels: (Array.isArray(q.mood_levels) && q.mood_levels.length > 0) ? q.mood_levels : defaultMoods,
      }));

      const idx = replaceAtIndexRef.current;
      if (idx !== null && normalized.length > 0) {
        // Single regeneration: replace only the question at the given index
        setQuestions(prev => prev.map((q, i) => i === idx ? normalized[0] : q));
      } else {
        setQuestions(normalized);
      }
      replaceAtIndexRef.current = null;
      setRegeneratingIndex(null);

      setGenerationMeta({ model: data.model, duration_ms: data.duration_ms });
      setValidationReport(null);
      toast.success(t('aiGenerator.generateSuccess', { count: data.questions.length }));
    },
    onError: (error: Error) => {
      replaceAtIndexRef.current = null;
      setRegeneratingIndex(null);
      if (error.message.includes('Rate limit')) {
        toast.error(t('aiGenerator.rateLimitError'));
      } else if (error.message.includes('credits')) {
        toast.error(t('aiGenerator.creditsError'));
      } else {
        toast.error(error.message || t('aiGenerator.generateError'));
      }
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (params: { questions: EnhancedGeneratedQuestion[]; accuracyMode: string; model?: string; enableCriticPass: boolean; minWordLength: number; selectedFrameworkIds?: string[]; knowledgeDocumentIds?: string[]; hasDocuments?: boolean; periodId?: string }) => {
      const { data, error } = await supabase.functions.invoke('validate-questions', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as ValidationReport;
    },
    onSuccess: (report) => {
      setValidationReport(report);
      setQuestions(prev =>
        prev.map((q, i) => ({
          ...q,
          validation_status: (report.per_question[i]?.validation_status || 'pending') as any,
          validation_details: report.per_question[i]?.validation_details || {},
        }))
      );
      const msg = report.overall_result === 'passed'
        ? t('aiGenerator.validationPassed')
        : report.overall_result === 'warning'
          ? t('aiGenerator.validationWarnings')
          : t('aiGenerator.validationFailed');
      toast[report.overall_result === 'failed' ? 'error' : report.overall_result === 'warning' ? 'warning' : 'success'](msg);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('aiGenerator.validationError'));
    },
  });

  const saveWellnessMutation = useMutation({
    mutationFn: async (params: { questions: EnhancedGeneratedQuestion[]; targetBatchId?: string }) => {
      const { data, error } = await supabase.functions.invoke('save-question-batch', {
        body: {
          purpose: 'wellness',
          questions: params.questions,
          targetBatchId: params.targetBatchId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.savedCount as number;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      queryClient.invalidateQueries({ queryKey: ['wellness-batches'] });
      queryClient.invalidateQueries({ queryKey: ['wellness-questions'] });
      toast.success(t('aiGenerator.wellnessSaveSuccess', { count }));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('aiGenerator.wellnessSaveError'));
    },
  });

  const saveSetMutation = useMutation({
    mutationFn: async (params: {
      questions: EnhancedGeneratedQuestion[];
      model: string;
      accuracyMode: string;
      settings: any;
      validationReport: ValidationReport | null;
      targetBatchId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('save-question-batch', {
        body: {
          purpose: 'survey',
          questions: params.questions,
          targetBatchId: params.targetBatchId,
          model: params.model,
          accuracyMode: params.accuracyMode,
          settings: params.settings,
          validationReport: params.validationReport ? {
            overall_result: params.validationReport.overall_result,
            validation_results: params.validationReport.validation_results,
            critic_result: params.validationReport.critic_result,
          } : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      toast.success(t('batches.saveSuccess'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('aiGenerator.saveError'));
    },
  });

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (validationReport) {
      setValidationReport(prev => prev ? {
        ...prev,
        per_question: prev.per_question.filter((_, i) => i !== index),
      } : null);
    }
  };

  const updateQuestion = (index: number, updates: Partial<EnhancedGeneratedQuestion>) => {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, ...updates } : q));
  };

  const clearAll = () => {
    setQuestions([]);
    setValidationReport(null);
    setGenerationMeta(null);
  };

  return {
    questions,
    validationReport,
    generationMeta,
    generate: (input: GenerateInput & { _replaceAtIndex?: number }) => {
      setRegeneratingIndex(input._replaceAtIndex ?? null);
      generateMutation.mutate(input);
    },
    validate: validateMutation.mutate,
    saveSet: saveSetMutation.mutate,
    saveWellness: saveWellnessMutation.mutate,
    removeQuestion,
    updateQuestion,
    clearAll,
    isGenerating: generateMutation.isPending,
    regeneratingIndex,
    isValidating: validateMutation.isPending,
    isSaving: saveSetMutation.isPending,
    isSavingWellness: saveWellnessMutation.isPending,
  };
}
