/**
 * AI Service — wraps edge function invocations for AI features.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';

export interface RewritePromptParams {
  prompt: string;
  model: string;
  useExpertKnowledge?: boolean;
  selectedFrameworkIds?: string[];
  documentSummaries?: string;
}

export interface RewriteQuestionParams {
  question_text: string;
  question_text_ar: string;
  type: string;
  prompt: string;
  model?: string;
}

export interface RewriteResult {
  success: boolean;
  rewrittenPrompt?: string;
  question_text?: string;
  question_text_ar?: string;
  error?: string;
}

/**
 * Rewrite an AI generation prompt using the rewrite-prompt edge function.
 */
export async function rewritePrompt(params: RewritePromptParams): Promise<RewriteResult> {
  const { data, error } = await supabase.functions.invoke('rewrite-prompt', {
    body: params,
  });

  if (error) throw error;
  if (data?.error) {
    return { success: false, error: data.error };
  }

  return {
    success: true,
    rewrittenPrompt: data?.rewrittenPrompt,
  };
}

/**
 * Rewrite a single question using the rewrite-question edge function.
 */
export async function rewriteQuestion(params: RewriteQuestionParams): Promise<RewriteResult> {
  const { data, error } = await supabase.functions.invoke('rewrite-question', {
    body: params,
  });

  if (error) throw error;
  if (!data?.success) {
    return { success: false, error: data?.error || 'Unknown error' };
  }

  return {
    success: true,
    question_text: data.question_text,
    question_text_ar: data.question_text_ar,
  };
}
