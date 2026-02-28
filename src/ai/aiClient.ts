/**
 * AI Client — validates inputs/outputs with Zod, delegates to the edge function,
 * and tags Sentry for observability. No React imports.
 */

import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';
import { AIResponseInvalidError, ServiceUnavailableError } from '@/services/errors';
import { getProviderFromModel } from '@/config/ai';
import type { GenerateStructuredInput, EdgeGenerateResponse, AITelemetryContext } from '@/ai/types';

const TAG = 'aiClient';

/**
 * Send a structured-generation request to the edge function and Zod-validate the result.
 * Throws DomainError subclasses only — never raw fetch/network errors.
 */
export async function generateStructured<
  TVars extends z.ZodTypeAny,
  TOut extends z.ZodTypeAny,
>(
  input: GenerateStructuredInput<TVars, TOut>,
  /** Extra body fields forwarded to the edge function (e.g. advancedSettings) */
  extraBody: Record<string, unknown> = {},
): Promise<z.infer<TOut>> {
  const { promptDef, variables, modelOverride } = input;

  // 1. Validate caller-supplied variables
  const varResult = promptDef.variablesSchema.safeParse(variables);
  if (!varResult.success) {
    const msg = `Invalid AI input variables: ${varResult.error.issues.map(i => i.message).join(', ')}`;
    logger.error(TAG, msg);
    throw new AIResponseInvalidError(msg);
  }

  const startMs = performance.now();
  let telemetry: Partial<AITelemetryContext> = {
    feature: promptDef.feature,
    promptId: promptDef.id,
    promptVersion: promptDef.version,
    success: false,
    usedFallback: false,
  };

  try {
    // 2. Call edge function — the edge function handles provider routing + fallback
    const { data, error } = await supabase.functions.invoke('generate-questions', {
      body: {
        ...varResult.data,
        ...extraBody,
        model: modelOverride ?? extraBody.model,
      },
    });

    if (error) {
      logger.error(TAG, 'Edge function invocation failed', error);
      throw new ServiceUnavailableError('AI generation failed');
    }

    const response = data as EdgeGenerateResponse;

    if (response?.error) {
      logger.warn(TAG, 'Edge function returned error', response.error);
      throw new ServiceUnavailableError(response.error);
    }

    // 3. Validate output against Zod schema
    const outResult = promptDef.outputSchema.safeParse(response);
    if (!outResult.success) {
      const issues = outResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
      logger.error(TAG, `AI output validation failed: ${issues}`);
      throw new AIResponseInvalidError(`AI output invalid: ${issues}`);
    }

    // 4. Telemetry (no PII)
    telemetry = {
      ...telemetry,
      provider: getProviderFromModel(response.model || ''),
      model: response.model,
      durationMs: Math.round(performance.now() - startMs),
      success: true,
      usedFallback: response.used_fallback ?? false,
    };

    return outResult.data;
  } catch (err) {
    telemetry.durationMs = Math.round(performance.now() - startMs);

    // Re-throw domain errors as-is
    if (err instanceof AIResponseInvalidError || err instanceof ServiceUnavailableError) {
      throw err;
    }
    logger.error(TAG, 'Unexpected AI error', err);
    throw new ServiceUnavailableError('AI generation failed');
  } finally {
    // Tag Sentry scope (never PII)
    Sentry.withScope((scope) => {
      scope.setTags({
        ai_provider: String(telemetry.provider ?? 'unknown'),
        ai_model: String(telemetry.model ?? 'unknown'),
        prompt_id: telemetry.promptId ?? '',
        prompt_version: String(telemetry.promptVersion ?? 0),
        ai_feature: telemetry.feature ?? '',
        ai_used_fallback: String(telemetry.usedFallback ?? false),
      });
      if (!telemetry.success) {
        Sentry.captureMessage(`AI generation failed: ${telemetry.feature}/${telemetry.promptId}`, 'warning');
      }
    });

    logger.debug(TAG, 'telemetry', {
      feature: telemetry.feature,
      promptId: telemetry.promptId,
      version: telemetry.promptVersion,
      provider: telemetry.provider,
      model: telemetry.model,
      durationMs: telemetry.durationMs,
      success: telemetry.success,
      usedFallback: telemetry.usedFallback,
    });
  }
}
