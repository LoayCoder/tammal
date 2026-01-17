import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export type QuestionType = 'likert_5' | 'numeric_scale' | 'yes_no' | 'open_ended' | 'multiple_choice';

export interface Question {
  id: string;
  tenant_id: string | null;
  category_id: string | null;
  text: string;
  text_ar: string | null;
  type: QuestionType;
  options: string[];
  is_active: boolean;
  is_global: boolean;
  ai_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: {
    id: string;
    name: string;
    name_ar: string | null;
    color: string;
    icon: string;
  };
}

export interface CreateQuestionInput {
  text: string;
  text_ar?: string;
  type: QuestionType;
  category_id?: string;
  options?: string[] | null;
  is_global?: boolean;
  is_active?: boolean;
  ai_generated?: boolean;
  tenant_id?: string;
}

export function useQuestions(categoryId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: questions = [], isLoading, error } = useQuery({
    queryKey: ['questions', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('questions')
        .select(`
          *,
          category:question_categories (
            id,
            name,
            name_ar,
            color,
            icon
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Question[];
    },
  });

  const createQuestion = useMutation({
    mutationFn: async (input: CreateQuestionInput) => {
      const { data, error } = await supabase
        .from('questions')
        .insert({
          ...input,
          options: input.options || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(t('questions.createSuccess'));
    },
    onError: () => {
      toast.error(t('questions.createError'));
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Question> & { id: string }) => {
      const { data, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(t('questions.updateSuccess'));
    },
    onError: () => {
      toast.error(t('questions.updateError'));
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('questions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(t('questions.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('questions.deleteError'));
    },
  });

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, is_active }: { ids: string[]; is_active: boolean }) => {
      const { error } = await supabase
        .from('questions')
        .update({ is_active })
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(t('questions.bulkUpdateSuccess'));
    },
    onError: () => {
      toast.error(t('questions.bulkUpdateError'));
    },
  });

  return {
    questions,
    isLoading,
    error,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    bulkUpdateStatus,
  };
}
