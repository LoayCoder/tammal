import {
  CheckCircle, Clock, UserX, Ban,
} from 'lucide-react';
import type { StatusBadgeConfig } from './StatusBadge';

// ── Tenant ───────────────────────────────────────────────────────────────────
export const TENANT_STATUS_CONFIG: StatusBadgeConfig = {
  active:    { variant: 'default',     className: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' },
  trial:     { variant: 'secondary',   className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  suspended: { variant: 'destructive', className: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30' },
  inactive:  { variant: 'outline',     className: 'bg-muted text-muted-foreground' },
};

// ── Account ──────────────────────────────────────────────────────────────────
export const ACCOUNT_STATUS_CONFIG: StatusBadgeConfig = {
  not_invited: { variant: 'outline',      icon: UserX,       labelKey: 'userManagement.notInvited' },
  invited:     { variant: 'secondary',    icon: Clock,       labelKey: 'userManagement.invitationSent' },
  active:      { variant: 'default',      icon: CheckCircle, labelKey: 'userManagement.activeUser' },
  suspended:   { variant: 'destructive',  icon: Ban,         labelKey: 'userManagement.suspendedUser' },
  inactive:    { variant: 'secondary',    icon: UserX,       labelKey: 'userManagement.inactiveUser' },
};

// ── Employee ─────────────────────────────────────────────────────────────────
export const EMPLOYEE_STATUS_CONFIG: StatusBadgeConfig = {
  active:     { variant: 'default' },
  resigned:   { variant: 'secondary' },
  terminated: { variant: 'destructive' },
};

// ── Recognition Cycle ────────────────────────────────────────────────────────
export const CYCLE_STATUS_CONFIG: StatusBadgeConfig = {
  configuring: { variant: 'outline' },
  nominating:  { variant: 'default' },
  voting:      { variant: 'default' },
  calculating: { variant: 'secondary' },
  announced:   { variant: 'default' },
  archived:    { variant: 'secondary' },
};

// ── AI Governance Risk ───────────────────────────────────────────────────────
export const RISK_LEVEL_CONFIG: StatusBadgeConfig = {
  low:    { variant: 'outline', className: 'bg-chart-2/20 text-chart-2 border-chart-2/30' },
  medium: { variant: 'outline', className: 'bg-chart-4/20 text-chart-4 border-chart-4/30' },
  high:   { variant: 'outline', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

// ── Schedule Status ──────────────────────────────────────────────────────────
export const SCHEDULE_STATUS_CONFIG: StatusBadgeConfig = {
  active: { variant: 'default',   className: 'bg-green-500' },
  paused: { variant: 'secondary' },
  draft:  { variant: 'outline' },
};

// ── Generic Task / Survey Status ─────────────────────────────────────────────
export const GENERIC_TASK_STATUS_CONFIG: StatusBadgeConfig = {
  todo:        { variant: 'secondary' },
  in_progress: { variant: 'default' },
  done:        { variant: 'default',   className: 'bg-chart-2/15 text-chart-2 border-chart-2/30' },
  blocked:     { variant: 'destructive' },
  completed:   { variant: 'default',   className: 'bg-chart-1/15 text-chart-1 border-chart-1/30' },
  not_started: { variant: 'secondary' },
};

// ── OKR Status ───────────────────────────────────────────────────────────────
export const OKR_STATUS_CONFIG: StatusBadgeConfig = {
  planned:     { variant: 'outline', className: 'bg-muted text-muted-foreground' },
  in_progress: { variant: 'outline', className: 'bg-chart-1/15 text-chart-1' },
  completed:   { variant: 'outline', className: 'bg-chart-2/15 text-chart-2' },
  on_track:    { variant: 'outline', className: 'bg-chart-2/15 text-chart-2 border-chart-2/30' },
  at_risk:     { variant: 'outline', className: 'bg-chart-4/15 text-chart-4 border-chart-4/30' },
  behind:      { variant: 'outline', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};
