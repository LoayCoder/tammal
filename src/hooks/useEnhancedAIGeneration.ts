import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

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
}

const MAX_BATCH_SIZE = 64;

const VALID_TYPES = ['likert_5', 'numeric_scale', 'yes_no', 'open_ended', 'multiple_choice'];

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

      setGenerationMeta({ model: data.model, duration_ms: data.duration_ms });
      setValidationReport(null);
      toast.success(t('aiGenerator.generateSuccess', { count: data.questions.length }));
    },
    onError: (error: Error) => {
      replaceAtIndexRef.current = null;
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
    mutationFn: async (params: { questions: EnhancedGeneratedQuestion[]; accuracyMode: string; model?: string; enableCriticPass: boolean; minWordLength: number; selectedFrameworkIds?: string[]; knowledgeDocumentIds?: string[]; hasDocuments?: boolean }) => {
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const tenantId = await supabase.rpc('get_user_tenant_id', { _user_id: userData.user.id }).then(r => r.data);
      if (!tenantId) throw new Error('No organization found. Please contact your administrator.');

      const mapToWellnessType = (type: string): string => {
        if (['scale', 'multiple_choice', 'text'].includes(type)) return type;
        if (type === 'likert_5' || type === 'numeric_scale') return 'scale';
        if (type === 'open_ended') return 'text';
        return 'scale';
      };

      const mapToQuestionType = (type: string): string => {
        if (['likert_5', 'numeric_scale', 'yes_no', 'multiple_choice', 'open_ended'].includes(type)) return type;
        if (type === 'scale') return 'likert_5';
        if (type === 'text') return 'open_ended';
        return 'likert_5';
      };

      let remainingQuestions = [...params.questions];

      // Append to existing batch if targetBatchId provided
      if (params.targetBatchId) {
        const { data: existingBatch, error: fetchErr } = await supabase
          .from('question_generation_batches')
          .select('id, question_count')
          .eq('id', params.targetBatchId)
          .single();
        if (fetchErr) throw fetchErr;

        const currentCount = existingBatch.question_count || 0;
        const capacity = MAX_BATCH_SIZE - currentCount;
        const toAppend = remainingQuestions.splice(0, capacity);

        if (toAppend.length > 0) {
          const wellnessInsert = toAppend.map(q => ({
            tenant_id: tenantId,
            batch_id: params.targetBatchId!,
            question_text_en: q.question_text,
            question_text_ar: q.question_text_ar || null,
            question_type: mapToWellnessType(q.type),
            options: q.type === 'multiple_choice' && q.options ? q.options : [],
            status: 'draft',
          }));
          const { error } = await supabase.from('wellness_questions').insert(wellnessInsert as any);
          if (error) throw error;

          await supabase
            .from('question_generation_batches')
            .update({ question_count: currentCount + toAppend.length } as any)
            .eq('id', params.targetBatchId!);
        }
      }

      // Create new batch for remaining questions (or all if no targetBatchId)
      if (remainingQuestions.length > 0) {
        const { data: batch, error: batchError } = await supabase
          .from('question_generation_batches')
          .insert({
            tenant_id: tenantId,
            target_month: format(new Date(), 'yyyy-MM-01'),
            question_count: remainingQuestions.length,
            status: 'draft',
            created_by: userData.user.id,
          } as any)
          .select()
          .single();
        if (batchError) throw batchError;

        const wellnessInsert = remainingQuestions.map(q => ({
          tenant_id: tenantId,
          batch_id: (batch as any).id,
          question_text_en: q.question_text,
          question_text_ar: q.question_text_ar || null,
          question_type: mapToWellnessType(q.type),
          options: q.type === 'multiple_choice' && q.options ? q.options : [],
          status: 'draft',
        }));
        const { error } = await supabase.from('wellness_questions').insert(wellnessInsert as any);
        if (error) throw error;
      }

      // Also save to unified questions table for mood pathway integration
      const unifiedInsert = params.questions.map(q => ({
        tenant_id: tenantId,
        text: q.question_text,
        text_ar: q.question_text_ar || null,
        type: mapToQuestionType(q.type),
        options: q.options || [],
        mood_levels: q.mood_levels || [],
        is_active: true,
        is_global: false,
        ai_generated: true,
        created_by: userData.user.id,
      }));
      await supabase.from('questions').insert(unifiedInsert as any);

      return params.questions.length;
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const tenantId = await supabase.rpc('get_user_tenant_id', { _user_id: userData.user.id }).then(r => r.data);
      if (!tenantId) throw new Error('No organization found. Please contact your administrator.');

      // Get user profile for batch name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userData.user.id)
        .single();

      const fullName = profile?.full_name || 'Unknown';
      const batchName = `${format(new Date(), 'dd MMMM yyyy')} - ${fullName}`;

      const allQuestions = params.questions;
      let remainingQuestions = [...allQuestions];

      // If adding to existing batch
      if (params.targetBatchId) {
        const targetBatch = await supabase
          .from('question_sets')
          .select('id, question_count')
          .eq('id', params.targetBatchId)
          .single();

        if (targetBatch.error) throw targetBatch.error;

        const currentCount = targetBatch.data.question_count || 0;
        const capacity = MAX_BATCH_SIZE - currentCount;
        const toAdd = remainingQuestions.splice(0, capacity);

        if (toAdd.length > 0) {
          const questionsToInsert = toAdd.map(q => ({
            question_set_id: params.targetBatchId!,
            tenant_id: tenantId,
            question_text: q.question_text,
            question_text_ar: q.question_text_ar,
            type: q.type,
            complexity: q.complexity,
            tone: q.tone,
            explanation: q.explanation,
            confidence_score: q.confidence_score,
            bias_flag: q.bias_flag,
            ambiguity_flag: q.ambiguity_flag,
            validation_status: q.validation_status,
            validation_details: q.validation_details,
            options: q.options || [],
          }));

          const { error: qError } = await supabase.from('generated_questions').insert(questionsToInsert);
          if (qError) throw qError;

          // Update question_count
          await supabase
            .from('question_sets')
            .update({ question_count: currentCount + toAdd.length })
            .eq('id', params.targetBatchId!);
        }
      }

      // Create new batches for remaining questions (including overflow)
      while (remainingQuestions.length > 0) {
        const chunk = remainingQuestions.splice(0, MAX_BATCH_SIZE);

        const { data: newBatch, error: setError } = await supabase
          .from('question_sets')
          .insert({
            tenant_id: tenantId,
            user_id: userData.user.id,
            model_used: params.model,
            accuracy_mode: params.accuracyMode,
            settings: params.settings,
            validation_result: params.validationReport?.validation_results || {},
            critic_pass_result: params.validationReport?.critic_result || null,
            status: params.validationReport?.overall_result === 'passed' ? 'validated' : 'draft',
            name: batchName,
            question_count: chunk.length,
          })
          .select()
          .single();

        if (setError) throw setError;

        const questionsToInsert = chunk.map(q => ({
          question_set_id: newBatch.id,
          tenant_id: tenantId,
          question_text: q.question_text,
          question_text_ar: q.question_text_ar,
          type: q.type,
          complexity: q.complexity,
          tone: q.tone,
          explanation: q.explanation,
          confidence_score: q.confidence_score,
          bias_flag: q.bias_flag,
          ambiguity_flag: q.ambiguity_flag,
          validation_status: q.validation_status,
          validation_details: q.validation_details,
          options: q.options || [],
        }));

        const { error: qError } = await supabase.from('generated_questions').insert(questionsToInsert);
        if (qError) throw qError;
      }
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
    generate: generateMutation.mutate,
    validate: validateMutation.mutate,
    saveSet: saveSetMutation.mutate,
    saveWellness: saveWellnessMutation.mutate,
    removeQuestion,
    updateQuestion,
    clearAll,
    isGenerating: generateMutation.isPending,
    isValidating: validateMutation.isPending,
    isSaving: saveSetMutation.isPending,
    isSavingWellness: saveWellnessMutation.isPending,
  };
}
