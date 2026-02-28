/**
 * Question Generator prompt definition.
 * Defines the Zod schemas for variables and output so aiClient can validate both sides.
 */

import { z } from 'zod';
import type { PromptDef } from '@/ai/types';

// ── Variables schema (what the caller supplies) ─────────────────
export const questionGeneratorVariablesSchema = z.object({
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
  moodLevels: z.array(z.string()).optional(),
  periodId: z.string().optional(),
});

// ── Single question output schema ───────────────────────────────
const questionItemSchema = z.object({
  question_text: z.string().min(1),
  question_text_ar: z.string().min(1),
  type: z.string(),
  complexity: z.string(),
  tone: z.string(),
  explanation: z.string(),
  confidence_score: z.number(),
  bias_flag: z.boolean(),
  ambiguity_flag: z.boolean(),
  validation_status: z.string().optional(),
  validation_details: z.record(z.unknown()).optional(),
  options: z.array(z.object({ text: z.string(), text_ar: z.string() })).optional(),
  framework_reference: z.string().nullish(),
  psychological_construct: z.string().nullish(),
  scoring_mechanism: z.string().nullish(),
  category_name: z.string().nullish(),
  subcategory_name: z.string().nullish(),
  mood_levels: z.array(z.string()).optional(),
  category_id: z.string().nullish(),
  subcategory_id: z.string().nullish(),
  mood_score: z.number().optional(),
  affective_state: z.string().optional(),
  generation_period_id: z.string().nullish(),
  question_hash: z.string().optional(),
});

// ── Full edge function response schema ──────────────────────────
export const questionGeneratorOutputSchema = z.object({
  success: z.literal(true),
  questions: z.array(questionItemSchema).min(1),
  model: z.string(),
  duration_ms: z.number(),
  provider: z.string().optional(),
  used_fallback: z.boolean().optional(),
});

// ── Prompt definition ───────────────────────────────────────────
export const questionGeneratorPrompt: PromptDef<
  typeof questionGeneratorVariablesSchema,
  typeof questionGeneratorOutputSchema
> = {
  id: 'question-generator',
  version: 1,
  feature: 'question-generator',
  variablesSchema: questionGeneratorVariablesSchema,
  outputSchema: questionGeneratorOutputSchema,
};

export type QuestionGeneratorVariables = z.infer<typeof questionGeneratorVariablesSchema>;
export type QuestionGeneratorOutput = z.infer<typeof questionGeneratorOutputSchema>;
export type GeneratedQuestionItem = z.infer<typeof questionItemSchema>;
