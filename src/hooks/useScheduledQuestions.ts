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
  question_source: string;
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

export interface SurveyScheduleMeta {
  schedule_id: string;
  schedule_name: string;
  start_date: string | null;
  end_date: string | null;
}

export function useScheduledQuestions(employeeId?: string, status?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: scheduledQuestions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-questions', employeeId, status],
    queryFn: async () => {
      // 1. Get only survey-type schedule IDs to keep this hook scoped to the survey page
      const { data: surveySchedules } = await supabase
        .from('question_schedules')
        .select('id')
        .eq('schedule_type', 'survey')
        .is('deleted_at', null);

      const surveyScheduleIds = (surveySchedules || []).map(s => s.id);
      if (!surveyScheduleIds.length) return [];

      let query = supabase
        .from('scheduled_questions')
        .select('*')
        .in('schedule_id', surveyScheduleIds)
        .order('scheduled_delivery', { ascending: true });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      if (status) {
        query = query.eq('status', status);
      } else {
        // Default: fetch pending, delivered (not yet answered)
        query = query.in('status', ['pending', 'delivered']);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data || [];

      // Fetch question details based on question_source
      const questionsIds = rows.filter(r => r.question_source === 'questions').map(r => r.question_id);
      const wellnessIds = rows.filter(r => r.question_source === 'wellness_questions').map(r => r.question_id);
      const generatedIds = rows.filter(r => r.question_source === 'generated_questions').map(r => r.question_id);

      let questionsMap: Record<string, any> = {};

      if (questionsIds.length > 0) {
        const { data: qData } = await supabase
          .from('questions')
          .select('id, text, text_ar, type, options, category:question_categories(id, name, name_ar, color)')
          .in('id', questionsIds);
        (qData || []).forEach((q: any) => {
          questionsMap[q.id] = {
            id: q.id,
            text: q.text,
            text_ar: q.text_ar,
            type: q.type,
            options: q.options,
            category: Array.isArray(q.category) ? q.category[0] : q.category,
          };
        });
      }

      if (wellnessIds.length > 0) {
        const { data: wData } = await supabase
          .from('wellness_questions')
          .select('id, question_text_en, question_text_ar, question_type, options')
          .in('id', wellnessIds);
        (wData || []).forEach((q: any) => {
          questionsMap[q.id] = {
            id: q.id,
            text: q.question_text_en,
            text_ar: q.question_text_ar,
            type: q.question_type,
            options: q.options,
            category: null,
          };
        });
      }

      if (generatedIds.length > 0) {
        const { data: gData } = await supabase
          .from('generated_questions')
          .select('id, question_text, question_text_ar, type, options')
          .in('id', generatedIds);
        (gData || []).forEach((q: any) => {
          questionsMap[q.id] = {
            id: q.id,
            text: q.question_text,
            text_ar: q.question_text_ar,
            type: q.type,
            options: q.options,
            category: null,
          };
        });
      }

      return rows.map((row: any) => ({
        ...row,
        question: questionsMap[row.question_id] || null,
      })) as ScheduledQuestion[];
    },
    enabled: !!employeeId,
  });

  // BUG-13 fix: Fetch ALL survey schedule metadata, not just the first one.
  // Returns the schedule whose time window is currently active (or the earliest upcoming one).
  const { data: surveyMeta } = useQuery({
    queryKey: ['survey-schedule-meta', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;

      const { data: sqData } = await supabase
        .from('scheduled_questions')
        .select('schedule_id')
        .eq('employee_id', employeeId)
        .in('status', ['pending', 'delivered']);

      if (!sqData?.length) return null;

      const scheduleIds = [...new Set(sqData.map(s => s.schedule_id))];

      const { data: schedules } = await supabase
        .from('question_schedules')
        .select('id, name, start_date, end_date, schedule_type')
        .in('id', scheduleIds)
        .eq('schedule_type', 'survey')
        .is('deleted_at', null);

      if (!schedules?.length) return null;

      // Pick the most relevant schedule: prefer currently-open, then earliest upcoming
      const now = new Date();
      const mapped = schedules.map(s => ({
        schedule_id: s.id,
        schedule_name: s.name,
        start_date: s.start_date,
        end_date: s.end_date,
      } as SurveyScheduleMeta));

      // Currently open window
      const active = mapped.find(m => {
        const started = !m.start_date || new Date(m.start_date) <= now;
        const notEnded = !m.end_date || new Date(m.end_date) >= now;
        return started && notEnded;
      });
      if (active) return active;

      // Earliest upcoming
      const upcoming = mapped
        .filter(m => m.start_date && new Date(m.start_date) > now)
        .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());
      if (upcoming.length) return upcoming[0];

      // Fallback: most recently ended
      return mapped.sort((a, b) => {
        const aEnd = a.end_date ? new Date(a.end_date).getTime() : 0;
        const bEnd = b.end_date ? new Date(b.end_date).getTime() : 0;
        return bEnd - aEnd;
      })[0];
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
    surveyMeta,
    isLoading,
    error,
    refetch,
    skipQuestion,
  };
}

export function useAnsweredSurveyCheck(employeeId?: string) {
  const { data: hasAnswered = false, isLoading } = useQuery({
    queryKey: ['answered-survey-check', employeeId],
    queryFn: async () => {
      if (!employeeId) return false;
      const { count } = await supabase
        .from('employee_responses')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employeeId)
        .eq('is_draft', false);
      return (count ?? 0) > 0;
    },
    enabled: !!employeeId,
  });

  return { hasAnswered, isLoading };
}
