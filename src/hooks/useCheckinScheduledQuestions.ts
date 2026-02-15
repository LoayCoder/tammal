import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CheckinScheduledQuestion {
  id: string;
  schedule_id: string;
  question_id: string;
  scheduled_delivery: string;
  status: string;
  question: {
    id: string;
    text: string;
    text_ar: string | null;
    type: string;
    options: unknown[] | null;
    category: {
      id: string;
      name: string;
      name_ar: string | null;
      color: string;
    } | null;
  } | null;
}

export function useCheckinScheduledQuestions(employeeId?: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: questions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['checkin-scheduled-questions', employeeId, today],
    queryFn: async () => {
      if (!employeeId) return [];

      const todayEnd = `${today}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('scheduled_questions')
        .select(`
          id,
          schedule_id,
          question_id,
          scheduled_delivery,
          status,
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
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'delivered'])
        .lte('scheduled_delivery', todayEnd)
        .order('scheduled_delivery', { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        question: Array.isArray(row.question) ? row.question[0] || null : row.question,
      })) as CheckinScheduledQuestion[];
    },
    enabled: !!employeeId,
  });

  return { questions, isLoading, error, refetch };
}
