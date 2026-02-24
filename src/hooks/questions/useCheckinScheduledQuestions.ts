import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CheckinScheduledQuestion {
  id: string;
  schedule_id: string;
  question_id: string;
  question_source: string;
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

export function useCheckinScheduledQuestions(employeeId?: string, excludeQuestionId?: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: questions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['checkin-scheduled-questions', employeeId, today, excludeQuestionId],
    queryFn: async () => {
      if (!employeeId) return [];

      const todayEnd = `${today}T23:59:59.999Z`;

      // Fetch only daily-checkin scheduled questions (exclude survey schedules)
      // First get active daily_checkin schedule IDs
      const { data: checkinSchedules } = await supabase
        .from('question_schedules')
        .select('id')
        .eq('schedule_type', 'daily_checkin')
        .is('deleted_at', null);

      const checkinScheduleIds = (checkinSchedules || []).map(s => s.id);
      if (!checkinScheduleIds.length) return [];

      const todayStart = `${today}T00:00:00.000Z`;

      const { data: scheduledRows, error: sqError } = await supabase
        .from('scheduled_questions')
        .select('id, schedule_id, question_id, question_source, scheduled_delivery, status')
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'delivered'])
        .in('schedule_id', checkinScheduleIds)
        .gte('scheduled_delivery', todayStart)
        .lte('scheduled_delivery', todayEnd)
        .order('scheduled_delivery', { ascending: true });

      if (sqError) throw sqError;
      if (!scheduledRows?.length) return [];

      // Group question IDs by source
      const questionsBySource: Record<string, string[]> = {};
      for (const row of scheduledRows) {
        const source = row.question_source || 'questions';
        if (!questionsBySource[source]) questionsBySource[source] = [];
        questionsBySource[source].push(row.question_id);
      }

      // Fetch question details from each source table
      const questionMap = new Map<string, CheckinScheduledQuestion['question']>();

      // From 'questions' table
      if (questionsBySource['questions']?.length) {
        const { data } = await supabase
          .from('questions')
          .select('id, text, text_ar, type, options, category:question_categories(id, name, name_ar, color)')
          .in('id', questionsBySource['questions']);
        (data || []).forEach((q: any) => {
          questionMap.set(q.id, {
            id: q.id,
            text: q.text,
            text_ar: q.text_ar,
            type: q.type,
            options: q.options,
            category: Array.isArray(q.category) ? q.category[0] || null : q.category,
          });
        });
      }

      // From 'wellness_questions' table
      if (questionsBySource['wellness_questions']?.length) {
        const { data } = await supabase
          .from('wellness_questions')
          .select('id, question_text_en, question_text_ar, question_type, options')
          .in('id', questionsBySource['wellness_questions']);
        (data || []).forEach((q: any) => {
          questionMap.set(q.id, {
            id: q.id,
            text: q.question_text_en,
            text_ar: q.question_text_ar,
            type: q.question_type,
            options: q.options,
            category: null,
          });
        });
      }

      // From 'generated_questions' table
      if (questionsBySource['generated_questions']?.length) {
        const { data } = await supabase
          .from('generated_questions')
          .select('id, question_text, question_text_ar, type, options')
          .in('id', questionsBySource['generated_questions']);
        (data || []).forEach((q: any) => {
          questionMap.set(q.id, {
            id: q.id,
            text: q.question_text,
            text_ar: q.question_text_ar,
            type: q.type,
            options: q.options,
            category: null,
          });
        });
      }

      // Merge and deduplicate (exclude the daily wellness question if provided)
      return scheduledRows
        .filter(row => !excludeQuestionId || row.question_id !== excludeQuestionId)
        .map(row => ({
          ...row,
          question_source: row.question_source || 'questions',
          question: questionMap.get(row.question_id) || null,
        }))
        .filter(row => row.question !== null) as CheckinScheduledQuestion[];
    },
    enabled: !!employeeId,
  });

  return { questions, isLoading, error, refetch };
}
