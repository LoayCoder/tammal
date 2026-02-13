import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface QuestionBatch {
  id: string;
  tenant_id: string;
  target_month: string;
  question_count: number;
  status: string;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
  deleted_at: string | null;
}

export function useQuestionBatchManagement(tenantId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const batchesQuery = useQuery({
    queryKey: ['wellness-batches', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('question_generation_batches' as any)
        .select('*')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as QuestionBatch[];
    },
    enabled: !!tenantId,
  });

  const questionsQuery = (batchId: string) =>
    supabase
      .from('wellness_questions' as any)
      .select('*')
      .eq('batch_id', batchId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

  const createBatch = useMutation({
    mutationFn: async (params: { targetMonth: string; questionCount: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('question_generation_batches' as any)
        .insert({
          tenant_id: tenantId,
          target_month: params.targetMonth,
          question_count: params.questionCount,
          status: 'draft',
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellness-batches'] });
      toast({ title: t('common.success'), description: t('wellness.batchCreated') });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  const bulkPublish = useMutation({
    mutationFn: async (batchId: string) => {
      // Update batch status
      const { error: batchErr } = await supabase
        .from('question_generation_batches' as any)
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', batchId);
      if (batchErr) throw batchErr;

      // Update all child questions
      const { error: qErr } = await supabase
        .from('wellness_questions' as any)
        .update({ status: 'published' })
        .eq('batch_id', batchId);
      if (qErr) throw qErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellness-batches'] });
      toast({ title: t('common.success'), description: t('wellness.batchPublished') });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  const createSchedules = useMutation({
    mutationFn: async (batchId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('create-batch-schedules', {
        body: { batchId },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: t('common.success'), description: t('wellness.batchScheduled') });
    },
    onError: (err: Error) => {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    },
  });

  const softDelete = useMutation({
    mutationFn: async (batchId: string) => {
      const { error } = await supabase
        .from('question_generation_batches' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', batchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellness-batches'] });
      toast({ title: t('common.success') });
    },
  });

  return {
    batches: batchesQuery.data || [],
    isLoading: batchesQuery.isLoading,
    fetchQuestions: questionsQuery,
    createBatch,
    bulkPublish,
    createSchedules,
    softDelete,
  };
}
