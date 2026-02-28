/**
 * Survey-mode prompt definition.
 * Explicitly excludes moodLevels from the variables schema.
 */

import { z } from 'zod';
import type { PromptDef } from '@/ai/types';
import { questionGeneratorOutputSchema } from './questionGenerator';

// Survey variables: moodLevels is explicitly forbidden
export const surveyVariablesSchema = z.object({
  questionCount: z.number().int().min(1).max(50),
  complexity: z.enum(['simple', 'moderate', 'advanced']),
  tone: z.string().min(1),
  questionType: z.string().optional(),
  accuracyMode: z.enum(['standard', 'high', 'strict']).optional(),
  advancedSettings: z.record(z.unknown()).optional(),
  language: z.enum(['en', 'ar', 'both']).optional(),
  useExpertKnowledge: z.boolean().optional(),
  knowledgeDocumentIds: z.array(z.string()).optional(),
  customPrompt: z.string().optional(),
  selectedFrameworks: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  subcategoryIds: z.array(z.string()).optional(),
  periodId: z.string().optional(),
  // moodLevels deliberately omitted for survey mode
}).strict();

export const surveyPromptDef: PromptDef<
  typeof surveyVariablesSchema,
  typeof questionGeneratorOutputSchema
> = {
  id: 'question-generator-survey',
  version: 1,
  feature: 'question-generator',
  variablesSchema: surveyVariablesSchema,
  outputSchema: questionGeneratorOutputSchema,
};

export type SurveyVariables = z.infer<typeof surveyVariablesSchema>;
