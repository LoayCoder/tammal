import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface GeneratedQuestion {
  text: string;
  text_ar: string;
  type: 'likert_5' | 'numeric_scale' | 'yes_no' | 'open_ended' | 'multiple_choice';
  category: string;
  options?: { text: string; text_ar: string }[];
}

export interface GenerateQuestionsInput {
  focusAreas: string[];
  questionCount: number;
  complexity: 'simple' | 'moderate' | 'advanced';
  tone: 'formal' | 'casual' | 'neutral';
  employeeContext?: string;
  categoryNames?: string[];
  language?: 'en' | 'ar' | 'both';
}

export function useAIQuestionGeneration() {
  const { t } = useTranslation();
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  const generateQuestions = useMutation({
    mutationFn: async (input: GenerateQuestionsInput) => {
      const { data, error } = await supabase.functions.invoke('generate-questions', {
        body: input,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.questions as GeneratedQuestion[];
    },
    onSuccess: (questions) => {
      setGeneratedQuestions(questions);
      toast.success(t('aiGenerator.generateSuccess', { count: questions.length }));
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit')) {
        toast.error(t('aiGenerator.rateLimitError'));
      } else if (error.message.includes('credits')) {
        toast.error(t('aiGenerator.creditsError'));
      } else {
        toast.error(error.message || t('aiGenerator.generateError'));
      }
    },
  });

  const clearGenerated = () => {
    setGeneratedQuestions([]);
  };

  const removeQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
    setGeneratedQuestions(prev => 
      prev.map((q, i) => i === index ? { ...q, ...updates } : q)
    );
  };

  return {
    generateQuestions,
    generatedQuestions,
    clearGenerated,
    removeQuestion,
    updateQuestion,
    isGenerating: generateQuestions.isPending,
  };
}