import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface QuestionSubcategory {
  id: string;
  tenant_id: string | null;
  category_id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  color: string;
  weight: number;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateSubcategoryInput {
  category_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  color?: string;
  weight?: number;
  is_global?: boolean;
  is_active?: boolean;
  tenant_id?: string;
}

export function useQuestionSubcategories(categoryId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: subcategories = [], isLoading, error } = useQuery({
    queryKey: ['question-subcategories', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('question_subcategories' as any)
        .select('*')
        .is('deleted_at', null)
        .order('weight', { ascending: false })
        .order('name', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as QuestionSubcategory[];
    },
  });

  const createSubcategory = useMutation({
    mutationFn: async (input: CreateSubcategoryInput) => {
      const { data, error } = await supabase
        .from('question_subcategories' as any)
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-subcategories'] });
      toast.success(t('subcategories.createSuccess'));
    },
    onError: () => {
      toast.error(t('subcategories.createError'));
    },
  });

  const updateSubcategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuestionSubcategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('question_subcategories' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-subcategories'] });
      toast.success(t('subcategories.updateSuccess'));
    },
    onError: () => {
      toast.error(t('subcategories.updateError'));
    },
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_subcategories' as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-subcategories'] });
      toast.success(t('subcategories.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('subcategories.deleteError'));
    },
  });

  return {
    subcategories,
    isLoading,
    error,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}
