import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface EmployeeResponse {
  id: string;
  scheduled_question_id: string | null;
  employee_id: string;
  question_id: string;
  tenant_id: string;
  answer_value: unknown;
  answer_text: string | null;
  responded_at: string;
  response_time_seconds: number | null;
  device_type: 'web' | 'mobile';
  session_id: string | null;
  created_at: string;
  is_draft?: boolean;
  survey_session_id?: string | null;
}

export interface SubmitResponseInput {
  scheduledQuestionId: string;
  answerValue: unknown;
  answerText?: string;
  responseTimeSeconds?: number;
  deviceType?: 'web' | 'mobile';
  sessionId?: string;
  isDraft?: boolean;
  surveySessionId?: string;
}

export interface BulkSubmitInput {
  bulk: true;
  isDraft: boolean;
  surveySessionId: string;
  responses: {
    scheduledQuestionId: string;
    answerValue: unknown;
    answerText?: string;
  }[];
  deviceType?: 'web' | 'mobile';
}

export function useEmployeeResponses(employeeId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: responses = [], isLoading, error } = useQuery({
    queryKey: ['employee-responses', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase
        .from('employee_responses')
        .select('*')
        .eq('employee_id', employeeId)
        .order('responded_at', { ascending: false });

      if (error) throw error;
      return data as EmployeeResponse[];
    },
    enabled: !!employeeId,
  });

  const submitResponse = useMutation({
    mutationFn: async (input: SubmitResponseInput) => {
      const { data, error } = await supabase.functions.invoke('submit-response', {
        body: input,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-questions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-responses'] });
      queryClient.invalidateQueries({ queryKey: ['draft-responses'] });
      toast.success(t('survey.responseSubmitted'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('survey.submitError'));
    },
  });

  const saveDraft = useMutation({
    mutationFn: async (input: BulkSubmitInput) => {
      const { data, error } = await supabase.functions.invoke('submit-response', {
        body: { ...input, isDraft: true },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-responses'] });
      toast.success(t('survey.draftSaved', 'Draft saved'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('survey.draftError', 'Failed to save draft'));
    },
  });

  const submitSurvey = useMutation({
    mutationFn: async (input: BulkSubmitInput) => {
      const { data, error } = await supabase.functions.invoke('submit-response', {
        body: { ...input, isDraft: false },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-questions'] });
      queryClient.invalidateQueries({ queryKey: ['employee-responses'] });
      queryClient.invalidateQueries({ queryKey: ['draft-responses'] });
      toast.success(t('survey.surveySubmitted', 'Survey submitted successfully'));
    },
    onError: (error: Error) => {
      toast.error(error.message || t('survey.submitError'));
    },
  });

  return {
    responses,
    isLoading,
    error,
    submitResponse,
    saveDraft,
    submitSurvey,
  };
}

export function useDraftResponses(employeeId?: string, surveyScheduleId?: string) {
  return useQuery({
    queryKey: ['draft-responses', employeeId, surveyScheduleId],
    queryFn: async () => {
      if (!employeeId || !surveyScheduleId) return [];

      const { data: sqData } = await supabase
        .from('scheduled_questions')
        .select('id')
        .eq('schedule_id', surveyScheduleId)
        .eq('employee_id', employeeId);

      if (!sqData?.length) return [];

      const sqIds = sqData.map(sq => sq.id);

      // BUG-12: Filter out soft-deleted draft rows
      const { data, error } = await supabase
        .from('employee_responses')
        .select('*')
        .in('scheduled_question_id', sqIds)
        .eq('employee_id', employeeId)
        .eq('is_draft', true)
        .is('deleted_at', null);

      if (error) throw error;
      return data as EmployeeResponse[];
    },
    enabled: !!employeeId && !!surveyScheduleId,
  });
}
