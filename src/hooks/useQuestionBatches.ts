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

const MAX_BATCH_SIZE = 64;

export function useQuestionBatches(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [expandedBatchQuestions, setExpandedBatchQuestions] = useState<Record<string, BatchQuestion[]>>({});

  const batchesQuery = useQuery({
    queryKey: ['question-batches', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('question_sets')
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch creator names for all batches
      const userIds = [...new Set((data || []).map(b => b.user_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        if (profiles) {
          profileMap = Object.fromEntries(profiles.map(p => [p.user_id, p.full_name || '']));
        }
      }

      return (data || []).map(b => ({
        ...b,
        creator_name: b.user_id ? profileMap[b.user_id] || null : null,
      })) as QuestionBatch[];
    },
    enabled: !!tenantId,
  });

  const fetchBatchQuestions = async (batchId: string) => {
    const { data, error } = await supabase
      .from('generated_questions')
      .select('*')
      .eq('question_set_id', batchId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const questions = (data || []) as BatchQuestion[];
    setExpandedBatchQuestions(prev => ({ ...prev, [batchId]: questions }));
    return questions;
  };

  const deleteBatch = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('question_sets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-batches'] });
      toast.success(t('batches.deleteSuccess'));
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const availableBatches = (batchesQuery.data || []).filter(
    b => b.question_count < MAX_BATCH_SIZE
  );

  return {
    batches: batchesQuery.data || [],
    isLoading: batchesQuery.isLoading,
    availableBatches,
    fetchBatchQuestions,
    expandedBatchQuestions,
    deleteBatch,
    MAX_BATCH_SIZE,
  };
}
