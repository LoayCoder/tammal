/**
 * Domain Error Classes — standardized error hierarchy for the service layer.
 *
 * Rules:
 * - Services MUST throw only DomainError subclasses.
 * - No Postgres error codes, raw Supabase errors, or generic `new Error()`.
 * - Hooks catch using `instanceof` — never inspect `.code`.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a mood entry already exists for the given employee + date. */
export class DuplicateCheckinError extends DomainError {
  constructor(message = 'Check-in already submitted for today') {
    super(message);
    this.name = 'DuplicateCheckinError';
  }
}

/** Thrown when an invitation code is invalid, expired, or already used. */
export class InviteInvalidError extends DomainError {
  constructor(message = 'Invitation code is invalid or expired') {
    super(message);
    this.name = 'InviteInvalidError';
  }
}

/** Thrown when the caller lacks permission for the requested operation. */
export class PermissionDeniedError extends DomainError {
  constructor(message = 'Permission denied') {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

/** Catch-all for unexpected infrastructure failures (DB down, network, etc.). */
export class ServiceUnavailableError extends DomainError {
  constructor(message = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

/** Thrown when the AI response fails Zod output-schema validation. */
export class AIResponseInvalidError extends DomainError {
  constructor(message = 'AI response did not match expected schema') {
    super(message);
    this.name = 'AIResponseInvalidError';
  }
}

/** Thrown when both primary and fallback AI providers time out. */
export class AIProviderTimeoutError extends DomainError {
  constructor(message = 'AI provider timed out') {
    super(message);
    this.name = 'AIProviderTimeoutError';
  }
}

/** Thrown when a tenant exceeds their configured AI usage limit. */
export class CostLimitExceededError extends DomainError {
  constructor(limitType: string, percent: number) {
    super(`AI cost limit exceeded (${limitType}: ${percent.toFixed(1)}%)`);
    this.name = 'CostLimitExceededError';
  }
}

/** Thrown when a user or tenant exceeds the AI request rate limit. */
export class RateLimitExceededError extends DomainError {
  constructor(scope: 'user' | 'tenant', windowKey: string) {
    super(`Rate limit exceeded (${scope}) for window ${windowKey}`);
    this.name = 'RateLimitExceededError';
  }
}
