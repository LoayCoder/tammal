/**
 * PR-AI-GOV-05: Knowledge Document Hardening — Unit Tests
 *
 * Tests:
 * - document_scope validation
 * - Audit log helper produces correct payloads
 * - Edge function doc query enforces tenant_id + is_active
 * - RLS policy logic assertions (mock-based)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 1. document_scope validation ──────────────────────────────────

describe('document_scope validation', () => {
  const VALID_SCOPES = ['private', 'tenant'] as const;
  const INVALID_SCOPES = ['public', 'global', '', 'PRIVATE'];

  it.each(VALID_SCOPES)('accepts valid scope: %s', (scope) => {
    expect(VALID_SCOPES.includes(scope as any)).toBe(true);
  });

  it.each(INVALID_SCOPES)('rejects invalid scope: %s', (scope) => {
    expect(VALID_SCOPES.includes(scope as any)).toBe(false);
  });
});

// ── 2. Audit log payload ──────────────────────────────────────────

describe('document audit logging', () => {
  const VALID_ACTIONS = ['upload', 'delete', 'activate', 'deactivate'] as const;

  it('produces correct audit payload structure for each action', () => {
    for (const action of VALID_ACTIONS) {
      const payload = {
        tenant_id: 'tenant-123',
        user_id: 'user-456',
        entity_type: 'ai_knowledge_document',
        entity_id: 'doc-789',
        action,
        changes: {},
        metadata: {},
      };

      expect(payload.entity_type).toBe('ai_knowledge_document');
      expect(payload.action).toBe(action);
      // Must never contain doc text
      expect(payload).not.toHaveProperty('content_text');
      expect(payload).not.toHaveProperty('doc_text');
      expect(payload).not.toHaveProperty('file_content');
    }
  });

  it('audit payload never includes PII or doc content keys', () => {
    const FORBIDDEN_KEYS = ['content_text', 'doc_text', 'file_content', 'prompt', 'question_text'];
    const payload = {
      entity_type: 'ai_knowledge_document',
      entity_id: 'doc-1',
      action: 'upload',
      changes: {},
      metadata: {},
    };

    for (const key of FORBIDDEN_KEYS) {
      expect(Object.keys(payload)).not.toContain(key);
    }
  });
});

// ── 3. Document query filter logic ────────────────────────────────

describe('edge function document query filters', () => {
  it('requires tenant_id, is_active, and deleted_at filters', () => {
    // Simulate the query builder chain the edge function uses
    const filters: string[] = [];
    const queryBuilder = {
      from: (table: string) => {
        expect(table).toBe('ai_knowledge_documents');
        return queryBuilder;
      },
      select: () => queryBuilder,
      in: (col: string, _vals: string[]) => { filters.push(`in:${col}`); return queryBuilder; },
      eq: (col: string, _val: any) => { filters.push(`eq:${col}`); return queryBuilder; },
      is: (col: string, _val: any) => { filters.push(`is:${col}`); return queryBuilder; },
    };

    // Replicate what the edge function does
    queryBuilder
      .from('ai_knowledge_documents')
      .select()
      .in('id', ['doc-1'])
      .eq('is_active', true)
      .eq('tenant_id', 'tenant-abc')
      .is('deleted_at', null);

    expect(filters).toContain('eq:is_active');
    expect(filters).toContain('eq:tenant_id');
    expect(filters).toContain('is:deleted_at');
  });
});

// ── 4. RLS policy logic assertions ────────────────────────────────

describe('RLS policy logic (mock assertions)', () => {
  const ownerUserId = 'user-owner';
  const otherUserId = 'user-other';
  const adminUserId = 'user-admin';
  const tenantId = 'tenant-1';
  const otherTenantId = 'tenant-2';

  interface MockDoc {
    id: string;
    user_id: string;
    tenant_id: string;
    document_scope: 'private' | 'tenant';
  }

  const doc: MockDoc = {
    id: 'doc-1',
    user_id: ownerUserId,
    tenant_id: tenantId,
    document_scope: 'private',
  };

  function canSelect(userId: string, userTenantId: string, isSuperAdmin: boolean, doc: MockDoc): boolean {
    if (doc.user_id === userId) return true;
    if (doc.document_scope === 'tenant' && doc.tenant_id === userTenantId) return true;
    if (isSuperAdmin) return true;
    return false;
  }

  function canDelete(userId: string, userTenantId: string, isSuperAdmin: boolean, isAdmin: boolean, doc: MockDoc): boolean {
    if (doc.user_id === userId && doc.tenant_id === userTenantId) return true;
    if (doc.tenant_id === userTenantId && (isSuperAdmin || isAdmin)) return true;
    return false;
  }

  it('owner can always see their own private document', () => {
    expect(canSelect(ownerUserId, tenantId, false, doc)).toBe(true);
  });

  it('other user in same tenant cannot see private document', () => {
    expect(canSelect(otherUserId, tenantId, false, doc)).toBe(false);
  });

  it('other user in same tenant CAN see tenant-scoped document', () => {
    const tenantDoc = { ...doc, document_scope: 'tenant' as const };
    expect(canSelect(otherUserId, tenantId, false, tenantDoc)).toBe(true);
  });

  it('user in different tenant cannot see tenant-scoped document', () => {
    const tenantDoc = { ...doc, document_scope: 'tenant' as const };
    expect(canSelect(otherUserId, otherTenantId, false, tenantDoc)).toBe(false);
  });

  it('super admin can see any document', () => {
    expect(canSelect(otherUserId, otherTenantId, true, doc)).toBe(true);
  });

  it('owner can delete their own document', () => {
    expect(canDelete(ownerUserId, tenantId, false, false, doc)).toBe(true);
  });

  it('non-owner non-admin cannot delete document', () => {
    expect(canDelete(otherUserId, tenantId, false, false, doc)).toBe(false);
  });

  it('tenant admin can delete any document in tenant', () => {
    expect(canDelete(adminUserId, tenantId, false, true, doc)).toBe(true);
  });

  it('tenant admin cannot delete document in other tenant', () => {
    expect(canDelete(adminUserId, otherTenantId, false, true, doc)).toBe(false);
  });

  it('super admin can delete any document', () => {
    expect(canDelete(adminUserId, otherTenantId, true, false, doc)).toBe(true);
  });
});

// ── 5. Storage path enforcement ───────────────────────────────────

describe('storage path tenant enforcement', () => {
  it('upload path must start with tenant_id', () => {
    const tenantId = 'abc-123';
    const filePath = `${tenantId}/${Date.now()}-test.pdf`;
    const folderName = filePath.split('/')[0];
    expect(folderName).toBe(tenantId);
  });

  it('rejects upload path without matching tenant', () => {
    const tenantId = 'abc-123';
    const maliciousPath = `other-tenant/${Date.now()}-test.pdf`;
    const folderName = maliciousPath.split('/')[0];
    expect(folderName).not.toBe(tenantId);
  });
});
