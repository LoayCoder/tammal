import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──
const { mockRpc, mockSignUp, mockChainUpdate, mockChainInsert, mockChainSingle } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockSignUp: vi.fn(),
  mockChainUpdate: vi.fn(),
  mockChainInsert: vi.fn(),
  mockChainSingle: vi.fn(),
}));

const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  update: mockChainUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  insert: mockChainInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: mockChainSingle.mockResolvedValue({ data: { id: 'emp-new' }, error: null }),
    }),
    error: null,
  }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => chain),
    rpc: mockRpc,
    auth: { signUp: mockSignUp },
  },
}));

import { verifyInviteCode, acceptInvite, type InvitationData } from '@/features/auth/services/inviteService';

const VALID_RPC_RESULT = [{
  id: 'inv-1',
  code: 'ABCD1234',
  email: 'test@example.com',
  full_name: 'Test User',
  tenant_id: 'tenant-1',
  employee_id: null,
  tenant_name: 'Acme Corp',
  used: false,
}];

const VALID_INVITATION: InvitationData = {
  id: 'inv-1',
  code: 'ABCD1234',
  email: 'test@example.com',
  full_name: 'Test User',
  tenant_id: 'tenant-1',
  employee_id: null,
  tenants: { name: 'Acme Corp' },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Re-wire defaults after clearAllMocks
  chain.select.mockReturnThis();
  chain.eq.mockReturnThis();
  mockChainUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  mockChainInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'emp-new' }, error: null }),
    }),
    error: null,
  });
});

describe('verifyInviteCode', () => {
  it('returns valid status with invitation data', async () => {
    mockRpc.mockResolvedValueOnce({ data: VALID_RPC_RESULT, error: null });

    const result = await verifyInviteCode('abcd1234');

    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.invitation.email).toBe('test@example.com');
    }
  });

  it('uppercases the code before querying', async () => {
    mockRpc.mockResolvedValueOnce({ data: VALID_RPC_RESULT, error: null });

    await verifyInviteCode('abcd1234');

    expect(mockRpc).toHaveBeenCalledWith('verify_invitation_code', { p_code: 'ABCD1234' });
  });

  it('returns used status when invitation was already consumed', async () => {
    mockRpc.mockResolvedValueOnce({ data: [{ ...VALID_RPC_RESULT[0], used: true }], error: null });

    const result = await verifyInviteCode('ABCD1234');

    expect(result.status).toBe('used');
  });

  it('returns invalid status when code does not exist at all', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    const result = await verifyInviteCode('ZZZZZZZZ');

    expect(result.status).toBe('invalid');
  });

  it('returns invalid when rpc returns empty array', async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await verifyInviteCode('ZZZZZZZZ');

    expect(result.status).toBe('invalid');
  });
});

describe('acceptInvite', () => {
  it('completes full happy path without throwing', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'new-user-id' } },
      error: null,
    });

    await expect(
      acceptInvite({
        invitation: VALID_INVITATION,
        fullName: 'Test User',
        password: 'SecurePass123!',
        redirectUrl: 'https://app.example.com',
      })
    ).resolves.toBeUndefined();

    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', password: 'SecurePass123!' })
    );
  });

  it('throws when signup fails with error', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Email already registered' },
    });

    await expect(
      acceptInvite({
        invitation: VALID_INVITATION,
        fullName: 'Test',
        password: 'pass',
        redirectUrl: 'https://app.test',
      })
    ).rejects.toThrow('Email already registered');
  });

  it('throws when user object is null (no error object)', async () => {
    mockSignUp.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(
      acceptInvite({
        invitation: VALID_INVITATION,
        fullName: 'Test',
        password: 'pass',
        redirectUrl: 'https://app.test',
      })
    ).rejects.toThrow('User creation failed');
  });
});
