import { describe, it, expect } from 'vitest';
import { redactPii, safeSummarize } from '../guards/piiRedactor';

describe('piiRedactor', () => {
  describe('redactPii', () => {
    it('redacts email addresses', () => {
      const result = redactPii('Contact me at john@example.com for details');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('email');
      expect(result.redactedText).not.toContain('john@example.com');
      expect(result.redactedText).toContain('[REDACTED_EMAIL]');
    });

    it('redacts multiple emails', () => {
      const result = redactPii('Send to a@b.com and c@d.org');
      expect(result.redactedText).not.toContain('a@b.com');
      expect(result.redactedText).not.toContain('c@d.org');
      expect(result.matches).toEqual(['email']);
    });

    it('redacts phone numbers with international prefix', () => {
      const result = redactPii('Call +966 50 123 4567');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('phone');
      expect(result.redactedText).not.toContain('4567');
    });

    it('redacts US SSN pattern', () => {
      const result = redactPii('SSN: 123-45-6789');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('national_id');
      expect(result.redactedText).not.toContain('6789');
    });

    it('redacts Saudi national ID', () => {
      const result = redactPii('ID number: 1234567890');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('national_id');
      expect(result.redactedText).not.toContain('1234567890');
    });

    it('redacts credit card numbers', () => {
      const result = redactPii('Card: 4111 1111 1111 1111');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('credit_card');
      expect(result.redactedText).not.toContain('4111');
    });

    it('redacts IBAN strings', () => {
      const result = redactPii('IBAN: SA03 8000 0000 6080 1016 7519');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('iban');
      expect(result.redactedText).not.toContain('1016');
    });

    it('detects multiple PII types', () => {
      const result = redactPii('Email: test@x.com, SSN: 123-45-6789');
      expect(result.redacted).toBe(true);
      expect(result.matches).toContain('email');
      expect(result.matches).toContain('national_id');
    });

    it('returns unchanged text when no PII found', () => {
      const clean = 'How satisfied are you with your team collaboration?';
      const result = redactPii(clean);
      expect(result.redacted).toBe(false);
      expect(result.matches).toEqual([]);
      expect(result.redactedText).toBe(clean);
    });

    it('handles null/empty input gracefully', () => {
      expect(redactPii('')).toEqual({ redactedText: '', redacted: false, matches: [] });
      expect(redactPii(null as any)).toEqual({ redactedText: '', redacted: false, matches: [] });
      expect(redactPii(undefined as any)).toEqual({ redactedText: '', redacted: false, matches: [] });
    });
  });

  describe('safeSummarize', () => {
    it('returns length and PII status without content', () => {
      const result = safeSummarize('Contact admin@co.com for help');
      expect(result.length).toBe(29);
      expect(result.hasPii).toBe(true);
      expect(result.piiTypes).toContain('email');
    });

    it('handles null/undefined', () => {
      expect(safeSummarize(null)).toEqual({ length: 0, hasPii: false, piiTypes: [] });
      expect(safeSummarize(undefined)).toEqual({ length: 0, hasPii: false, piiTypes: [] });
    });
  });
});
