/**
 * Wellness-mode prompt definition.
 * Includes moodLevels as a required field (when wellness questions are generated).
 */

import { z } from 'zod';
import type { PromptDef } from '@/ai/types';
import { questionGeneratorOutputSchema } from './questionGenerator';

// Wellness variables: moodLevels is required (at least one)
export const wellnessVariablesSchema = z.object({
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
  moodLevels: z.array(z.string()).min(1, 'Wellness mode requires at least one mood level'),
  periodId: z.string().optional(),
}).strict();

export const wellnessPromptDef: PromptDef<
  typeof wellnessVariablesSchema,
  typeof questionGeneratorOutputSchema
> = {
  id: 'question-generator-wellness',
  version: 1,
  feature: 'question-generator',
  variablesSchema: wellnessVariablesSchema,
  outputSchema: questionGeneratorOutputSchema,
};

export type WellnessVariables = z.infer<typeof wellnessVariablesSchema>;
