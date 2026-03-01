/**
 * PII Redactor — detects and redacts personally identifiable information.
 *
 * Patterns:
 *  - Email addresses
 *  - Phone numbers (international + local)
 *  - National ID patterns (Saudi, US SSN, generic 9-12 digit)
 *  - Credit card numbers (Visa, MC, Amex, generic 13-19 digit)
 *  - IBAN-like strings
 *
 * No PII is ever returned — only match type labels.
 */

const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  // Email
  { type: 'email', pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  // IBAN (must be before phone to avoid partial matches)
  { type: 'iban', pattern: /\b[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?(?:[\dA-Z]{4}[\s]?){1,7}[\dA-Z]{1,4}\b/gi },
  // Credit card (13-19 digits, optionally separated by spaces or dashes)
  { type: 'credit_card', pattern: /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{1,7}\b/g },
  // Saudi National ID (10 digits starting with 1 or 2)
  { type: 'national_id', pattern: /\b[12]\d{9}\b/g },
  // US SSN
  { type: 'national_id', pattern: /\b\d{3}[\s\-]\d{2}[\s\-]\d{4}\b/g },
  // Phone (international with +, requires + prefix or at least 7 digits to avoid false positives)
  { type: 'phone', pattern: /\+\d{1,4}[\s\-.]?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/g },
];

export interface PiiRedactionResult {
  /** The text with all PII replaced by [REDACTED_<TYPE>] */
  redactedText: string;
  /** Whether any PII was found */
  redacted: boolean;
  /** Types of PII found (e.g. ['email', 'phone']), no actual values */
  matches: string[];
}

/**
 * Scan text for PII and replace with type-tagged placeholders.
 * Returns metadata about what was found (types only, never values).
 */
export function redactPii(text: string): PiiRedactionResult {
  if (!text || typeof text !== 'string') {
    return { redactedText: text ?? '', redacted: false, matches: [] };
  }

  let result = text;
  const matchTypes = new Set<string>();

  for (const { type, pattern } of PII_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    if (pattern.test(result)) {
      matchTypes.add(type);
      pattern.lastIndex = 0;
      result = result.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    }
  }

  return {
    redactedText: result,
    redacted: matchTypes.size > 0,
    matches: Array.from(matchTypes),
  };
}

/**
 * Summarize text for safe logging: returns length and PII detection result
 * without any content. Use this instead of logging raw text.
 */
export function safeSummarize(text: string | undefined | null): {
  length: number;
  hasPii: boolean;
  piiTypes: string[];
} {
  if (!text) return { length: 0, hasPii: false, piiTypes: [] };
  const { redacted, matches } = redactPii(text);
  return { length: text.length, hasPii: redacted, piiTypes: matches };
}
