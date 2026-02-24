import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface QuestionCategory {
  id: string;
  tenant_id: string | null;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  color: string;
  icon: string;
  weight: number;
  is_global: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCategoryInput {
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  color?: string;
  icon?: string;
  weight?: number;
  is_global?: boolean;
  is_active?: boolean;
  tenant_id?: string;
}

export function useQuestionCategories() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['question-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_categories')
        .select('*')
        .is('deleted_at', null)
        .order('weight', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as QuestionCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const { data, error } = await supabase
        .from('question_categories')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
      toast.success(t('categories.createSuccess'));
    },
    onError: () => {
      toast.error(t('categories.createError'));
    },
  });

  const cascadeColorToSubcategories = async (categoryId: string, color: string) => {
    await supabase
      .from('question_subcategories')
      .update({ color })
      .eq('category_id', categoryId)
      .is('deleted_at', null);
    queryClient.invalidateQueries({ queryKey: ['question-subcategories'] });
  };

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuestionCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('question_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Cascade color change to subcategories
      if (updates.color) {
        await cascadeColorToSubcategories(id, updates.color);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
      toast.success(t('categories.updateSuccess'));
    },
    onError: () => {
      toast.error(t('categories.updateError'));
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-categories'] });
      toast.success(t('categories.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('categories.deleteError'));
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
