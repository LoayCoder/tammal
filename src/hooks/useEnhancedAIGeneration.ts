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
}

const MAX_BATCH_SIZE = 64;

export function useEnhancedAIGeneration() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<EnhancedGeneratedQuestion[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [generationMeta, setGenerationMeta] = useState<{ model: string; duration_ms: number } | null>(null);

  const generateMutation = useMutation({
    mutationFn: async (input: GenerateInput) => {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: input,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      setQuestions(data.questions);
      setGenerationMeta({ model: data.model, duration_ms: data.duration_ms });
      setValidationReport(null);
      toast.success(t('aiGenerator.generateSuccess', { count: data.questions.length }));
    },
    onError: (error: Error) => {
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
    removeQuestion,
    updateQuestion,
    clearAll,
    isGenerating: generateMutation.isPending,
    isValidating: validateMutation.isPending,
    isSaving: saveSetMutation.isPending,
  };
}
