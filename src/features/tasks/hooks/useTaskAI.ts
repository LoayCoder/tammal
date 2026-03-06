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

export interface PrioritySuggestion {
  suggested_priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  reasoning: string;
  factors: { factor: string; weight: 'low' | 'medium' | 'high'; detail: string }[];
}

export interface ChecklistSuggestion {
  items: { title: string; estimated_minutes: number }[];
  reasoning: string;
}

export interface DependencySuggestion {
  task_id: string;
  task_title: string;
  dependency_type: 'blocks' | 'blocked_by' | 'related';
  confidence: number;
  reason: string;
}

function useAIMutation<T>(taskId: string | undefined, action: string) {
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('task-ai-engine', {
        body: { action, task_id: taskId },
      });
      if (error) throw error;
      return data?.data as T;
    },
    onError: (e: any) => {
      toast.error(e?.message || t('taskAI.error'));
    },
  });
}

export function useTaskAI(taskId: string | undefined) {
  const suggestAssignee = useAIMutation<{ suggestions: AssigneeSuggestion[] }>(taskId, 'suggest_assignee');
  const estimateCompletion = useAIMutation<CompletionEstimate>(taskId, 'estimate_completion');
  const predictRisk = useAIMutation<RiskPrediction>(taskId, 'predict_risk');
  const suggestPriority = useAIMutation<PrioritySuggestion>(taskId, 'suggest_priority');
  const suggestChecklist = useAIMutation<ChecklistSuggestion>(taskId, 'suggest_checklist');
  const suggestDependencies = useAIMutation<{ suggestions: DependencySuggestion[] }>(taskId, 'suggest_dependencies');

  return {
    suggestAssignee,
    estimateCompletion,
    predictRisk,
    suggestPriority,
    suggestChecklist,
    suggestDependencies,
    isLoading:
      suggestAssignee.isPending ||
      estimateCompletion.isPending ||
      predictRisk.isPending ||
      suggestPriority.isPending ||
      suggestChecklist.isPending ||
      suggestDependencies.isPending,
  };
}
