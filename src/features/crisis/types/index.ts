export interface FirstAider {
  id: string;
  tenant_id: string;
  user_id: string;
  display_name: string;
  department: string | null;
  role_title: string | null;
  languages: string[] | null;
  bio: string | null;
  contact_modes: { chat?: boolean; call?: boolean; meeting?: boolean };
  max_active_cases: number;
  is_active: boolean;
  allow_anonymous_requests: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FirstAiderSchedule {
  id: string;
  tenant_id: string;
  first_aider_id: string;
  timezone: string;
  weekly_rules: Record<string, { from: string; to: string }[]>;
  response_sla_minutes: number;
  is_enabled: boolean;
  temp_unavailable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrisisCase {
  id: string;
  tenant_id: string;
  requester_user_id: string;
  assigned_first_aider_id: string | null;
  intent: string;
  risk_level: string;
  status: string;
  anonymity_mode: string;
  summary: string | null;
  reroute_count: number;
  created_at: string;
  accepted_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  matched_at: string | null;
  urgency_level: number | null;
  preferred_contact_method: string | null;
  scheduled_session_id: string | null;
}

export interface CrisisMessage {
  id: string;
  case_id: string;
  tenant_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export interface EmergencyContact {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  phone: string | null;
  country: string;
  available_24_7: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
