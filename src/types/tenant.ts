export interface SecuritySettings {
  mfa_trust_duration_days: number;
  session_timeout_minutes: number;
  ip_whitelist_enabled: boolean;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  mfa_trust_duration_days: 15,
  session_timeout_minutes: 15,
  ip_whitelist_enabled: false,
};
