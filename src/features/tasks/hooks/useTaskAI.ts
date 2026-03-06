import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface AssigneeSuggestion {
  employee_id: string;
  employee_name: string;
  confidence: number;
  reason: string;
}

export interface CompletionEstimate {
  estimated_minutes: number;
  confidence: number;
  reasoning: string;
  risk_factors: string[];
}

export interface RiskItem {
  category: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface RiskPrediction {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_score: number;
  risks: RiskItem[];
  summary: string;
}

export function useTaskAI(taskId: string | undefined) {
  const { t } = useTranslation();

  const suggestAssignee = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('task-ai-engine', {
        body: { action: 'suggest_assignee', task_id: taskId },
      });
      if (error) throw error;
      return data?.data as { suggestions: AssigneeSuggestion[] };
    },
    onError: (e: any) => {
      toast.error(e?.message || t('taskAI.error'));
    },
  });

  const estimateCompletion = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('task-ai-engine', {
        body: { action: 'estimate_completion', task_id: taskId },
      });
      if (error) throw error;
      return data?.data as CompletionEstimate;
    },
    onError: (e: any) => {
      toast.error(e?.message || t('taskAI.error'));
    },
  });

  const predictRisk = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('task-ai-engine', {
        body: { action: 'predict_risk', task_id: taskId },
      });
      if (error) throw error;
      return data?.data as RiskPrediction;
    },
    onError: (e: any) => {
      toast.error(e?.message || t('taskAI.error'));
    },
  });

  return {
    suggestAssignee,
    estimateCompletion,
    predictRisk,
    isLoading:
      suggestAssignee.isPending ||
      estimateCompletion.isPending ||
      predictRisk.isPending,
  };
}
