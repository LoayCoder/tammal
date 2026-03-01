import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeLog, isForbiddenLogKey, getForbiddenKeys } from '../guards/safeLog';

describe('safeLog', () => {
  const originalEnv = (globalThis as any).process?.env?.NODE_ENV;

  afterEach(() => {
    if ((globalThis as any).process?.env) {
      (globalThis as any).process.env.NODE_ENV = originalEnv;
    }
  });

  describe('in test/dev mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('throws when payload contains "prompt"', () => {
      expect(() => safeLog({ prompt: 'secret prompt', count: 5 }))
        .toThrow('Forbidden keys detected');
    });

    it('throws when payload contains "systemPrompt"', () => {
      expect(() => safeLog({ systemPrompt: 'sys', ok: true }))
        .toThrow('Forbidden keys detected');
    });

    it('throws when payload contains "question_text"', () => {
      expect(() => safeLog({ question_text: 'How are you?', id: '1' }))
        .toThrow('Forbidden keys detected');
    });

    it('throws when payload contains "doc_text"', () => {
      expect(() => safeLog({ doc_text: 'document content' }))
        .toThrow('Forbidden keys detected');
    });

    it('throws when payload contains "token"', () => {
      expect(() => safeLog({ token: 'abc123' }))
        .toThrow('Forbidden keys detected');
    });

    it('throws when payload contains "password"', () => {
      expect(() => safeLog({ password: 'secret' }))
        .toThrow('Forbidden keys detected');
    });

    it('throws when payload contains "messages"', () => {
      expect(() => safeLog({ messages: [{ role: 'user', content: 'hi' }] }))
        .toThrow('Forbidden keys detected');
    });

    it('lists all forbidden keys found in error message', () => {
      expect(() => safeLog({ prompt: 'x', doc_text: 'y', count: 1 }))
        .toThrow(/prompt.*doc_text|doc_text.*prompt/);
    });

    it('passes clean payloads through unchanged', () => {
      const payload = { count: 5, model: 'gemini', duration_ms: 1200 };
      expect(safeLog(payload)).toEqual(payload);
    });

    it('includes context in error message', () => {
      expect(() => safeLog({ prompt: 'x' }, 'myFunction'))
        .toThrow('[myFunction]');
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('strips forbidden keys and warns instead of throwing', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = safeLog({ prompt: 'secret', count: 5 });
      expect(result).toEqual({ count: 5 });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('prompt'));
      warnSpy.mockRestore();
    });
  });

  describe('isForbiddenLogKey', () => {
    it('returns true for known forbidden keys', () => {
      expect(isForbiddenLogKey('prompt')).toBe(true);
      expect(isForbiddenLogKey('systemPrompt')).toBe(true);
      expect(isForbiddenLogKey('question_text')).toBe(true);
      expect(isForbiddenLogKey('api_key')).toBe(true);
    });

    it('returns false for safe keys', () => {
      expect(isForbiddenLogKey('count')).toBe(false);
      expect(isForbiddenLogKey('duration_ms')).toBe(false);
      expect(isForbiddenLogKey('model')).toBe(false);
    });
  });

  describe('getForbiddenKeys', () => {
    it('returns a non-empty set', () => {
      const keys = getForbiddenKeys();
      expect(keys.size).toBeGreaterThan(10);
      expect(keys.has('prompt')).toBe(true);
    });
  });
});
