/**
 * useQuestionGenerator — thin React Query mutation wrapper over aiQuestionService.
 * No business logic here — just React Query plumbing.
 */

import { useMutation } from '@tanstack/react-query';
import { generateQuestions } from '@/services/aiQuestionService';
import type { QuestionGeneratorVariables, QuestionGeneratorOutput } from '@/ai/prompts/questionGenerator';
import { AIResponseInvalidError, ServiceUnavailableError, AIProviderTimeoutError } from '@/services/errors';

interface UseQuestionGeneratorOptions {
  onSuccess?: (data: QuestionGeneratorOutput) => void;
  onError?: (error: Error) => void;
}

export function useQuestionGenerator(opts?: UseQuestionGeneratorOptions) {
  const mutation = useMutation({
    mutationFn: async (params: {
      variables: QuestionGeneratorVariables;
      extraBody?: Record<string, unknown>;
    }) => {
      return generateQuestions(params.variables, params.extraBody);
    },
    onSuccess: opts?.onSuccess,
    onError: opts?.onError,
  });

  return {
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
    data: mutation.data ?? null,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    /** Helper to check if the error is a known AI domain error */
    isAIError: (err: unknown): err is AIResponseInvalidError | ServiceUnavailableError | AIProviderTimeoutError =>
      err instanceof AIResponseInvalidError ||
      err instanceof ServiceUnavailableError ||
      err instanceof AIProviderTimeoutError,
  };
}
