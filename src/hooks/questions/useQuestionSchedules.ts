import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface QuestionSchedule {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  frequency: '1_per_day' | '2_per_day' | '3_days_per_week' | 'weekly' | 'custom';
  custom_schedule: Record<string, unknown> | null;
  target_audience: { all?: boolean; departments?: string[]; specific_employees?: string[] };
  active_categories: string[];
  timezone: string;
  preferred_time: string;
  avoid_weekends: boolean;
  avoid_holidays: boolean;
  questions_per_delivery: number;
  enable_ai_generation: boolean;
  enable_validation: boolean;
  status: 'active' | 'paused' | 'draft';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  batch_ids: string[];
  weekend_days: number[];
  schedule_type: 'daily_checkin' | 'survey';
  start_date: string | null;
  end_date: string | null;
  generation_period_id: string | null;
}

export interface CreateScheduleInput {
  tenant_id: string;
  name: string;
  description?: string;
  frequency?: QuestionSchedule['frequency'];
  custom_schedule?: Record<string, unknown>;
  target_audience?: QuestionSchedule['target_audience'];
  active_categories?: string[];
  timezone?: string;
  preferred_time?: string;
  avoid_weekends?: boolean;
  avoid_holidays?: boolean;
  questions_per_delivery?: number;
  enable_ai_generation?: boolean;
  enable_validation?: boolean;
  status?: QuestionSchedule['status'];
  batch_ids?: string[];
  weekend_days?: number[];
  schedule_type?: 'daily_checkin' | 'survey';
  start_date?: string | null;
  end_date?: string | null;
  generation_period_id?: string | null;
}

export function useQuestionSchedules(tenantId?: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: schedules = [], isPending, error } = useQuery({
    queryKey: ['question-schedules', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('question_schedules')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data.map(schedule => ({
        ...schedule,
        target_audience: (schedule.target_audience || { all: true }) as QuestionSchedule['target_audience'],
        active_categories: (schedule.active_categories || []) as string[],
        batch_ids: (schedule.batch_ids || []) as string[],
        weekend_days: (schedule.weekend_days || [5, 6]) as number[],
        schedule_type: (schedule.schedule_type || 'daily_checkin') as QuestionSchedule['schedule_type'],
        start_date: schedule.start_date || null,
        end_date: schedule.end_date || null,
        generation_period_id: (schedule as any).generation_period_id || null,
      })) as QuestionSchedule[];
    },
  });

  const createSchedule = useMutation({
    mutationFn: async (input: CreateScheduleInput) => {
      const insertData = {
        tenant_id: input.tenant_id,
        name: input.name,
        description: input.description,
        frequency: input.frequency,
        custom_schedule: input.custom_schedule as unknown as null,
        target_audience: (input.target_audience || { all: true }) as unknown as null,
        active_categories: (input.active_categories || []) as unknown as null,
        timezone: input.timezone,
        preferred_time: input.preferred_time,
        avoid_weekends: input.avoid_weekends,
        avoid_holidays: input.avoid_holidays,
        questions_per_delivery: input.questions_per_delivery,
        enable_ai_generation: input.enable_ai_generation,
        enable_validation: input.enable_validation,
        status: input.status,
        batch_ids: (input.batch_ids || []) as unknown as null,
        weekend_days: (input.weekend_days || [5, 6]) as unknown as null,
        schedule_type: input.schedule_type || 'daily_checkin',
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        generation_period_id: input.generation_period_id || null,
      };

      const { data, error } = await supabase
        .from('question_schedules')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-schedules'] });
      toast.success(t('schedules.createSuccess'));
    },
    onError: () => {
      toast.error(t('schedules.createError'));
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuestionSchedule> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency;
      if (updates.custom_schedule !== undefined) updateData.custom_schedule = updates.custom_schedule;
      if (updates.target_audience !== undefined) updateData.target_audience = updates.target_audience;
      if (updates.active_categories !== undefined) updateData.active_categories = updates.active_categories;
      if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
      if (updates.preferred_time !== undefined) updateData.preferred_time = updates.preferred_time;
      if (updates.avoid_weekends !== undefined) updateData.avoid_weekends = updates.avoid_weekends;
      if (updates.avoid_holidays !== undefined) updateData.avoid_holidays = updates.avoid_holidays;
      if (updates.questions_per_delivery !== undefined) updateData.questions_per_delivery = updates.questions_per_delivery;
      if (updates.enable_ai_generation !== undefined) updateData.enable_ai_generation = updates.enable_ai_generation;
      if (updates.enable_validation !== undefined) updateData.enable_validation = updates.enable_validation;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.batch_ids !== undefined) updateData.batch_ids = updates.batch_ids;
      if (updates.weekend_days !== undefined) updateData.weekend_days = updates.weekend_days;
      if (updates.schedule_type !== undefined) updateData.schedule_type = updates.schedule_type;
      if (updates.start_date !== undefined) updateData.start_date = updates.start_date;
      if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
      if (updates.generation_period_id !== undefined) updateData.generation_period_id = updates.generation_period_id;
      
      const { data, error } = await supabase
        .from('question_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-schedules'] });
      toast.success(t('schedules.updateSuccess'));
    },
    onError: () => {
      toast.error(t('schedules.updateError'));
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('question_schedules')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-schedules'] });
      toast.success(t('schedules.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('schedules.deleteError'));
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'paused' }) => {
      const { data, error } = await supabase
        .from('question_schedules')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-schedules'] });
      toast.success(t('schedules.updateSuccess'));
    },
    onError: () => {
      toast.error(t('schedules.updateError'));
    },
  });

  return {
    schedules,
    isPending,
    error,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    toggleStatus,
  };
}