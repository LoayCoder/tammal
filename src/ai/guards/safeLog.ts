/**
 * SafeLog — prevents accidental logging of sensitive content.
 *
 * Throws in development/test if a log payload contains forbidden keys.
 * In production, silently strips forbidden keys and warns.
 */

/** Keys that must NEVER appear in log payloads */
const FORBIDDEN_KEYS = new Set([
  'prompt',
  'systemPrompt',
  'system_prompt',
  'customPrompt',
  'custom_prompt',
  'doc_text',
  'document_text',
  'content_text',
  'question_text',
  'question_text_ar',
  'extracted_text',
  'user_prompt',
  'messages',
  'token',
  'auth_token',
  'password',
  'secret',
  'api_key',
  'apiKey',
]);

export interface SafeLogViolation {
  forbiddenKeys: string[];
}

/**
 * Validate a structured log payload for forbidden keys.
 * - In dev/test: throws an error listing the forbidden keys found.
 * - In production: strips the keys and returns a cleaned copy.
 *
 * @param payload - The object to validate
 * @param context - Optional label for error messages
 * @returns The cleaned payload (forbidden keys removed)
 */
export function safeLog<T extends Record<string, unknown>>(
  payload: T,
  context = 'safeLog',
): Omit<T, string> {
  const found: string[] = [];

  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_KEYS.has(key)) {
      found.push(key);
    }
  }

  if (found.length === 0) return payload;

  // Check Vite env for dev mode detection (works in both browser and test)
  let isDev = false;
  try {
    isDev = !!(import.meta as any).env?.DEV;
  } catch {
    // fallback: not in Vite context
  }
  // Also check vitest / node test env
  try {
    isDev = isDev || (globalThis as any).process?.env?.NODE_ENV === 'development'
      || (globalThis as any).process?.env?.NODE_ENV === 'test';
  } catch {
    // not in node context
  }

  if (isDev) {
    throw new Error(
      `[${context}] Forbidden keys detected in log payload: [${found.join(', ')}]. ` +
      `Never log prompt content, document text, question text, or secrets.`,
    );
  }

  // Production: strip and warn
  const cleaned = { ...payload };
  for (const key of found) {
    delete (cleaned as Record<string, unknown>)[key];
  }
  console.warn(`[${context}] Stripped forbidden keys from log: [${found.join(', ')}]`);
  return cleaned;
}

/**
 * Check if a key is forbidden for logging.
 */
export function isForbiddenLogKey(key: string): boolean {
  return FORBIDDEN_KEYS.has(key);
}

/**
 * Get the full set of forbidden keys (for testing).
 */
export function getForbiddenKeys(): ReadonlySet<string> {
  return FORBIDDEN_KEYS;
}
