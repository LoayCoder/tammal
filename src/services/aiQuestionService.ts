/**
 * AI Question Service — pure async service.
 * Wraps aiClient with the question-generator prompt definition.
 * No React imports.
 */

import { generateStructured } from '@/ai/aiClient';
import {
  questionGeneratorPrompt,
  type QuestionGeneratorVariables,
  type QuestionGeneratorOutput,
} from '@/ai/prompts/questionGenerator';
import { logger } from '@/lib/logger';

const TAG = 'aiQuestionService';

/**
 * Generate questions via the AI platform.
 * Returns the validated response including questions[], model, and duration_ms.
 * Throws only DomainError subclasses.
 */
export async function generateQuestions(
  variables: QuestionGeneratorVariables,
  extraBody: Record<string, unknown> = {},
): Promise<QuestionGeneratorOutput> {
  logger.debug(TAG, 'generateQuestions called', {
    count: variables.questionCount,
    complexity: variables.complexity,
  });

  return generateStructured(
    {
      promptDef: questionGeneratorPrompt,
      variables,
      modelOverride: extraBody.model as string | undefined,
    },
    extraBody,
  );
}
