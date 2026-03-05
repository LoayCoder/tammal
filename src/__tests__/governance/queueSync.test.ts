import { describe, it, expect } from 'vitest';

/**
 * Pure-logic tests for the sync_action_to_queue trigger behavior.
 * These validate the mapping contract without a live DB.
 */

interface ActionFields {
  id: string;
  tenant_id: string;
  assignee_id: string | null;
  title: string;
  status: string;
  priority: string;
  planned_end: string | null;
  deleted_at: string | null;
}

interface QueueItem {
  action_id: string;
  tenant_id: string;
  employee_id: string | null;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  deleted_at: string | null;
}

/** Simulates the INSERT path of sync_action_to_queue */
function simulateQueueInsert(action: ActionFields): QueueItem {
  return {
    action_id: action.id,
    tenant_id: action.tenant_id,
    employee_id: action.assignee_id,
    title: action.title,
    status: action.status,
    priority: action.priority,
    due_date: action.planned_end,
    deleted_at: null,
  };
}

/** Simulates the UPDATE path (field sync) */
function simulateQueueUpdate(existing: QueueItem, newAction: ActionFields): QueueItem {
  // Soft-delete sync
  if (newAction.deleted_at !== null) {
    return { ...existing, deleted_at: new Date().toISOString() };
  }
  return {
    ...existing,
    employee_id: newAction.assignee_id,
    title: newAction.title,
    status: newAction.status,
    priority: newAction.priority,
    due_date: newAction.planned_end,
  };
}

const baseAction: ActionFields = {
  id: 'action-1',
  tenant_id: 'tenant-1',
  assignee_id: 'emp-1',
  title: 'Implement feature X',
  status: 'pending',
  priority: 'P2',
  planned_end: '2026-04-01',
  deleted_at: null,
};

describe('Queue Sync Trigger Logic', () => {
  it('creates queue item with matching fields on INSERT', () => {
    const queue = simulateQueueInsert(baseAction);
    expect(queue.action_id).toBe(baseAction.id);
    expect(queue.tenant_id).toBe(baseAction.tenant_id);
    expect(queue.employee_id).toBe(baseAction.assignee_id);
    expect(queue.title).toBe(baseAction.title);
    expect(queue.status).toBe(baseAction.status);
    expect(queue.priority).toBe(baseAction.priority);
    expect(queue.due_date).toBe(baseAction.planned_end);
    expect(queue.deleted_at).toBeNull();
  });

  it('propagates assignee change to queue', () => {
    const queue = simulateQueueInsert(baseAction);
    const updated = simulateQueueUpdate(queue, { ...baseAction, assignee_id: 'emp-2' });
    expect(updated.employee_id).toBe('emp-2');
  });

  it('cascades soft-delete to queue item', () => {
    const queue = simulateQueueInsert(baseAction);
    const deleted = simulateQueueUpdate(queue, { ...baseAction, deleted_at: '2026-03-05T00:00:00Z' });
    expect(deleted.deleted_at).not.toBeNull();
  });

  it('syncs completed status to queue', () => {
    const queue = simulateQueueInsert(baseAction);
    const completed = simulateQueueUpdate(queue, { ...baseAction, status: 'completed' });
    expect(completed.status).toBe('completed');
  });

  it('preserves action_id through updates', () => {
    const queue = simulateQueueInsert(baseAction);
    const updated = simulateQueueUpdate(queue, { ...baseAction, title: 'New Title', priority: 'P1' });
    expect(updated.action_id).toBe(baseAction.id);
    expect(updated.title).toBe('New Title');
    expect(updated.priority).toBe('P1');
  });
});
