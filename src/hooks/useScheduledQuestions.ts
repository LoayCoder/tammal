import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface ScheduledQuestion {
  id: string;
  schedule_id: string;
  employee_id: string;
  question_id: string;
  tenant_id: string;
  scheduled_delivery: string;
  actual_delivery: string | null;
  status: 'pending' | 'delivered' | 'answered' | 'skipped' | 'expired' | 'failed';
  delivery_channel: 'email' | 'app' | 'sms';
  reminder_count: number;
  created_at: string;
  question?: {
    id: string;
    text: string;
    text_ar: string | null;
    type: string;
    options: unknown[] | null;
    category?: {
      id: string;
      name: string;
      name_ar: string | null;
      color: string;
    };
  };
}

export function useScheduledQuestions(employeeId?: string, status?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: scheduledQuestions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-questions', employeeId, status],
    queryFn: async () => {
      let query = supabase
        .from('scheduled_questions')
        .select(`
          *,
          question:questions(
            id,
            text,
            text_ar,
            type,
            options,
            category:question_categories(
              id,
              name,
              name_ar,
              color
            )
          )
        `)
        .order('scheduled_delivery', { ascending: true });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: any) => ({
        ...row,
        question: Array.isArray(row.question) ? row.question[0] || null : row.question,
      })) as ScheduledQuestion[];
    },
    enabled: !!employeeId,
  });

  const pendingQuestions = scheduledQuestions.filter(
    sq => sq.status === 'delivered' || sq.status === 'pending'
  );

  const skipQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('scheduled_questions')
        .update({ status: 'skipped' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-questions'] });
      toast.success(t('survey.questionSkipped'));
    },
    onError: () => {
      toast.error(t('survey.skipError'));
    },
  });

  return {
    scheduledQuestions,
    pendingQuestions,
    isLoading,
    error,
    refetch,
    skipQuestion,
  };
}