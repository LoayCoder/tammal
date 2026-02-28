import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

export interface QuestionBatch {
  id: string;
  name: string | null;
  tenant_id: string | null;
  user_id: string | null;
  model_used: string;
  accuracy_mode: string;
  status: string;
  question_count: number;
  created_at: string | null;
  deleted_at: string | null;
  creator_name?: string | null;
  purpose: 'survey' | 'wellness';
  generation_period_id?: string | null;
}

export interface BatchQuestion {
  id: string;
  question_text: string;
  question_text_ar: string | null;
  type: string;
  complexity: string | null;
  tone: string | null;
  confidence_score: number | null;
  validation_status: string | null;
  bias_flag: boolean | null;
  ambiguity_flag: boolean | null;
  explanation: string | null;
  options: any;
  created_at: string | null;
}

import { MAX_BATCH_SIZE } from '@/config/constants';

export function useQuestionBatches(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [expandedBatchQuestions, setExpandedBatchQuestions] = useState<Record<string, BatchQuestion[]>>({});

  const batchesQuery = useQuery({
    queryKey: ['question-batches', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // Fetch survey batches from question_sets
      const { data: surveyData, error: surveyError } = await supabase
        .from('question_sets')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (surveyError) throw surveyError;

      // Fetch wellness batches from question_generation_batches
      const { data: wellnessData, error: wellnessError } = await supabase
        .from('question_generation_batches')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (wellnessError) throw wellnessError;

      // Collect all user IDs for profile lookup
      const surveyUserIds = (surveyData || []).map(b => b.user_id).filter(Boolean) as string[];
      const wellnessUserIds = (wellnessData || []).map(b => b.created_by).filter(Boolean) as string[];
      const allUserIds = [...new Set([...surveyUserIds, ...wellnessUserIds])];

      let profileMap: Record<string, string> = {};
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', allUserIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || '']));
        }
      }

      const surveyBatches: QuestionBatch[] = (surveyData || []).map(b => ({
        id: b.id,
        name: b.name,
        tenant_id: b.tenant_id,
        user_id: b.user_id,
        model_used: b.model_used,
        accuracy_mode: b.accuracy_mode,
        status: b.status,
        question_count: b.question_count,
        created_at: b.created_at,
        deleted_at: b.deleted_at,
        creator_name: b.user_id ? profileMap[b.user_id] || null : null,
        purpose: 'survey' as const,
        generation_period_id: (b as any).generation_period_id || null,
      }));

      const wellnessBatches: QuestionBatch[] = (wellnessData || []).map(b => ({
        id: b.id,
        name: (b as any).name || null,
        tenant_id: b.tenant_id,
        user_id: b.created_by,
        model_used: '',
        accuracy_mode: '',
        status: b.status,
        question_count: b.question_count,
        created_at: b.created_at,
        deleted_at: b.deleted_at,
        creator_name: b.created_by ? profileMap[b.created_by] || null : null,
        purpose: 'wellness' as const,
        generation_period_id: (b as any).generation_period_id || null,
      }));

      // Merge and sort by created_at descending
      const all = [...surveyBatches, ...wellnessBatches].sort((a, b) => {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return db - da;
      });

      return all;
    },
    enabled: !!tenantId,
  });

  const fetchBatchQuestions = async (batchId: string) => {
    // Find batch to determine purpose
    const batch = (batchesQuery.data || []).find(b => b.id === batchId);

    if (batch?.purpose === 'wellness') {
      // Fetch from wellness_questions
      const { data, error } = await supabase
        .from('wellness_questions')
        .select('*')
        .eq('batch_id', batchId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const questions: BatchQuestion[] = (data || []).map(q => ({
        id: q.id,
        question_text: q.question_text_en,
        question_text_ar: q.question_text_ar,
        type: q.question_type,
        complexity: null,
        tone: null,
        confidence_score: null,
        validation_status: q.status,
        bias_flag: null,
        ambiguity_flag: null,
        explanation: null,
        options: q.options,
        created_at: q.created_at,
      }));
      setExpandedBatchQuestions(prev => ({ ...prev, [batchId]: questions }));
      return questions;
    } else {
      // Fetch from generated_questions (survey)
      const { data, error } = await supabase
        .from('generated_questions')
        .select('*')
        .eq('question_set_id', batchId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const questions = (data || []) as BatchQuestion[];
      setExpandedBatchQuestions(prev => ({ ...prev, [batchId]: questions }));
      return questions;
    }
  };

  const publishBatch = useMutation({
    mutationFn: async (batchId: string) => {
      const batch = (batchesQuery.data || []).find(b => b.id === batchId);
      if (batch?.purpose === 'wellness') {
        // Publish all wellness questions in the batch
        await supabase
          .from('wellness_questions')
          .update({ status: 'published' })
          .eq('batch_id', batchId)
          .is('deleted_at', null);
        const { error } = await supabase
          .from('question_generation_batches')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', batchId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_sets')
          .update({ status: 'published' })
          .eq('id', batchId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      // Refresh expanded questions to show updated status
      setExpandedBatchQuestions(prev => {
        const updated = { ...prev };
        if (updated[batchId]) {
          updated[batchId] = updated[batchId].map(q => ({
            ...q,
            validation_status: 'published',
          }));
        }
        return updated;
      });
      toast.success(t('batches.publishSuccess', 'Batch published successfully'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deactivateBatch = useMutation({
    mutationFn: async (batchId: string) => {
      const batch = (batchesQuery.data || []).find(b => b.id === batchId);
      if (batch?.purpose === 'wellness') {
        await supabase
          .from('wellness_questions')
          .update({ status: 'inactive' } as any)
          .eq('batch_id', batchId)
          .is('deleted_at', null);
        const { error } = await supabase
          .from('question_generation_batches')
          .update({ status: 'inactive' } as any)
          .eq('id', batchId);
        if (error) throw error;
      } else {
        await supabase
          .from('generated_questions')
          .update({ validation_status: 'inactive' })
          .eq('question_set_id', batchId);
        const { error } = await supabase
          .from('question_sets')
          .update({ status: 'inactive' })
          .eq('id', batchId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      setExpandedBatchQuestions(prev => {
        const updated = { ...prev };
        if (updated[batchId]) {
          updated[batchId] = updated[batchId].map(q => ({
            ...q,
            validation_status: 'inactive',
          }));
        }
        return updated;
      });
      toast.success(t('batches.deactivateSuccess', 'Batch deactivated successfully'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deactivateQuestions = useMutation({
    mutationFn: async ({ batchId, questionIds, purpose }: { batchId: string; questionIds: string[]; purpose: 'survey' | 'wellness' }) => {
      if (purpose === 'wellness') {
        const { error } = await supabase
          .from('wellness_questions')
          .update({ status: 'inactive' } as any)
          .in('id', questionIds);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('generated_questions')
          .update({ validation_status: 'inactive' })
          .in('id', questionIds);
        if (error) throw error;
      }
    },
    onSuccess: (_data, { batchId, questionIds }) => {
      setExpandedBatchQuestions(prev => {
        const updated = { ...prev };
        if (updated[batchId]) {
          updated[batchId] = updated[batchId].map(q =>
            questionIds.includes(q.id) ? { ...q, validation_status: 'inactive' } : q
          );
        }
        return updated;
      });
      toast.success(t('batches.questionsDeactivated', 'Selected questions deactivated'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const activateBatch = useMutation({
    mutationFn: async (batchId: string) => {
      const batch = (batchesQuery.data || []).find(b => b.id === batchId);
      if (batch?.purpose === 'wellness') {
        await supabase
          .from('wellness_questions')
          .update({ status: 'published' } as any)
          .eq('batch_id', batchId)
          .is('deleted_at', null);
        const { error } = await supabase
          .from('question_generation_batches')
          .update({ status: 'published' } as any)
          .eq('id', batchId);
        if (error) throw error;
      } else {
        await supabase
          .from('generated_questions')
          .update({ validation_status: 'published' })
          .eq('question_set_id', batchId);
        const { error } = await supabase
          .from('question_sets')
          .update({ status: 'published' })
          .eq('id', batchId);
        if (error) throw error;
      }
    },
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      setExpandedBatchQuestions(prev => {
        const updated = { ...prev };
        if (updated[batchId]) {
          updated[batchId] = updated[batchId].map(q => ({
            ...q,
            validation_status: 'published',
          }));
        }
        return updated;
      });
      toast.success(t('batches.activateSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const activateQuestions = useMutation({
    mutationFn: async ({ batchId, questionIds, purpose }: { batchId: string; questionIds: string[]; purpose: 'survey' | 'wellness' }) => {
      if (purpose === 'wellness') {
        const { error } = await supabase
          .from('wellness_questions')
          .update({ status: 'published' } as any)
          .in('id', questionIds);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('generated_questions')
          .update({ validation_status: 'published' })
          .in('id', questionIds);
        if (error) throw error;
      }
    },
    onSuccess: (_data, { batchId, questionIds }) => {
      setExpandedBatchQuestions(prev => {
        const updated = { ...prev };
        if (updated[batchId]) {
          updated[batchId] = updated[batchId].map(q =>
            questionIds.includes(q.id) ? { ...q, validation_status: 'published' } : q
          );
        }
        return updated;
      });
      toast.success(t('batches.questionsActivated'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteBatch = useMutation({
    mutationFn: async (batchId: string) => {
      const batch = (batchesQuery.data || []).find(b => b.id === batchId);
      if (batch?.purpose === 'wellness') {
        await supabase
          .from('wellness_questions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('batch_id', batchId);
        const { error } = await supabase
          .from('question_generation_batches')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', batchId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_sets')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', batchId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      toast.success(t('batches.deleteSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const renameBatch = useMutation({
    mutationFn: async ({ batchId, newName }: { batchId: string; newName: string }) => {
      const batch = (batchesQuery.data || []).find(b => b.id === batchId);
      if (batch?.purpose === 'wellness') {
        const { error } = await supabase
          .from('question_generation_batches')
          .update({ name: newName } as any)
          .eq('id', batchId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('question_sets')
          .update({ name: newName })
          .eq('id', batchId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      toast.success(t('batches.renameSuccess', 'Batch renamed successfully'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const availableBatches = (batchesQuery.data || []).filter(
    b => b.purpose === 'survey' && b.question_count < MAX_BATCH_SIZE
  );

  const availableWellnessBatches = (batchesQuery.data || []).filter(
    b => b.purpose === 'wellness' && b.question_count < MAX_BATCH_SIZE && b.status === 'draft'
  );

  return {
    batches: batchesQuery.data || [],
    isPending: batchesQuery.isPending,
    availableBatches,
    availableWellnessBatches,
    fetchBatchQuestions,
    expandedBatchQuestions,
    publishBatch,
    deactivateBatch,
    deactivateQuestions,
    activateBatch,
    activateQuestions,
    deleteBatch,
    renameBatch,
    MAX_BATCH_SIZE,
  };
}
