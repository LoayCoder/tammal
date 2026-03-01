/**
 * PII Redactor for Edge Functions (Deno-compatible).
 * Mirrors src/ai/guards/piiRedactor.ts — no Node/Vite imports.
 */

const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: 'email', pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g },
  { type: 'phone', pattern: /(?:\+?\d{1,4}[\s\-.]?)?\(?\d{2,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}/g },
  { type: 'national_id', pattern: /\b[12]\d{9}\b/g },
  { type: 'national_id', pattern: /\b\d{3}[\s\-]\d{2}[\s\-]\d{4}\b/g },
  { type: 'credit_card', pattern: /\b(?:\d[\s\-]?){13,19}\b/g },
  { type: 'iban', pattern: /\b[A-Z]{2}\d{2}[\s]?[\dA-Z]{4}[\s]?(?:[\dA-Z]{4}[\s]?){1,7}[\dA-Z]{1,4}\b/gi },
];

export interface PiiScanResult {
  hasPii: boolean;
  piiTypes: string[];
  piiMatchCount: number;
}

/**
 * Scan text for PII patterns. Returns metadata only — never the values.
 */
export function scanForPii(text: string | null | undefined): PiiScanResult {
  if (!text) return { hasPii: false, piiTypes: [], piiMatchCount: 0 };

  const matchTypes = new Set<string>();
  let totalMatches = 0;

  for (const { type, pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      matchTypes.add(type);
      totalMatches += matches.length;
    }
  }

  return {
    hasPii: matchTypes.size > 0,
    piiTypes: Array.from(matchTypes),
    piiMatchCount: totalMatches,
  };
}
