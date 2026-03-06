/**
 * Enterprise Task Status Lifecycle
 * Mirrors the DB trigger `enforce_task_status_transition`.
 * Keep in sync with the database transition matrix.
 */

export type TaskStatus =
  | 'draft'
  | 'open'
  | 'in_progress'
  | 'under_review'
  | 'pending_approval'
  | 'completed'
  | 'rejected'
  | 'archived';

/** Valid transitions from each status (must match DB trigger exactly). */
export const VALID_TRANSITIONS: Record<string, TaskStatus[]> = {
  draft:             ['open', 'archived'],
  open:              ['in_progress', 'archived'],
  in_progress:       ['under_review', 'completed', 'archived'],
  under_review:      ['pending_approval', 'in_progress', 'rejected'],
  pending_approval:  ['completed', 'rejected'],
  completed:         ['archived'],
  rejected:          ['in_progress', 'draft', 'archived'],
  archived:          ['draft'],
  // Legacy statuses
  todo:              ['open', 'in_progress', 'archived'],
  planned:           ['open', 'in_progress', 'archived'],
};

/** Returns valid next statuses for a given current status, always including the current status itself. */
export function getValidNextStatuses(currentStatus: string): TaskStatus[] {
  const transitions = VALID_TRANSITIONS[currentStatus] ?? [];
  // Include current status so the select always shows the active value
  return [currentStatus as TaskStatus, ...transitions];
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  todo: 'bg-muted text-muted-foreground',
  planned: 'bg-muted text-muted-foreground',
  open: 'bg-chart-2/10 text-chart-2',
  in_progress: 'bg-chart-2/10 text-chart-2',
  under_review: 'bg-chart-4/10 text-chart-4',
  pending_approval: 'bg-chart-5/10 text-chart-5',
  completed: 'bg-chart-1/10 text-chart-1',
  rejected: 'bg-destructive/10 text-destructive',
  archived: 'bg-muted text-muted-foreground',
};
