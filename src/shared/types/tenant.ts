export interface SecuritySettings {
  mfa_trust_duration_days: number;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  glass_break_active: boolean;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  mfa_trust_duration_days: 15,
  session_timeout_minutes: 15,
  max_concurrent_sessions: 1,
  glass_break_active: false,
};
