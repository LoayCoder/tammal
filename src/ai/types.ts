/**
 * Provider-agnostic AI types — used by aiClient, services, and the edge function.
 * No React imports.
 */

import type { ProviderName } from '@/config/ai';
import type { z } from 'zod';

/** Identifies an AI prompt definition in the registry */
export interface PromptDef<
  TVars extends z.ZodTypeAny = z.ZodTypeAny,
  TOut extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** Unique prompt identifier for telemetry */
  id: string;
  /** Monotonic version — bump whenever the prompt template changes */
  version: number;
  /** The feature this prompt belongs to (e.g. 'question-generator') */
  feature: string;
  /** Zod schema for the variables the caller must supply */
  variablesSchema: TVars;
  /** Zod schema for the expected output from the AI */
  outputSchema: TOut;
}

/** Input to aiClient.generateStructured */
export interface GenerateStructuredInput<
  TVars extends z.ZodTypeAny = z.ZodTypeAny,
  TOut extends z.ZodTypeAny = z.ZodTypeAny,
> {
  promptDef: PromptDef<TVars, TOut>;
  variables: z.infer<TVars>;
  /** Override the default model for this call */
  modelOverride?: string;
}

/** Telemetry context attached to every AI call — NEVER includes PII */
export interface AITelemetryContext {
  feature: string;
  promptId: string;
  promptVersion: number;
  provider: ProviderName;
  model: string;
  durationMs: number;
  success: boolean;
  usedFallback: boolean;
}

/** Shape returned by the generate-questions edge function */
export interface EdgeGenerateResponse {
  success: boolean;
  questions: unknown[];
  model: string;
  duration_ms: number;
  provider?: string;
  used_fallback?: boolean;
  error?: string;
}
