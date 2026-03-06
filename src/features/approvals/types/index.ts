export interface Approval {
  id: string;
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  requested_by: string | null;
  approved_by: string | null;
  status: string;
  justification: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
