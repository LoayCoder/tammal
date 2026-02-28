import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted mocks ──
const { mockSingle, mockSignUp, mockChainUpdate, mockChainInsert } = vi.hoisted(() => ({
  mockSingle: vi.fn(),
  mockSignUp: vi.fn(),
  mockChainUpdate: vi.fn(),
  mockChainInsert: vi.fn(),
}));

const chain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  gt: vi.fn().mockReturnThis(),
  single: mockSingle,
  update: mockChainUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
  insert: mockChainInsert.mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'emp-new' }, error: null }),
    }),
    error: null,
  }),
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => chain),
    auth: { signUp: mockSignUp },
  },
}));

import { verifyInviteCode, acceptInvite, type InvitationData } from '../inviteService';

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
  chain.is.mockReturnThis();
  chain.gt.mockReturnThis();
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
    mockSingle.mockResolvedValueOnce({ data: VALID_INVITATION, error: null });

    const result = await verifyInviteCode('abcd1234');

    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.invitation.email).toBe('test@example.com');
    }
  });

  it('uppercases the code before querying', async () => {
    mockSingle.mockResolvedValueOnce({ data: VALID_INVITATION, error: null });

    await verifyInviteCode('abcd1234');

    expect(chain.eq).toHaveBeenCalledWith('code', 'ABCD1234');
  });

  it('returns used status when invitation was already consumed', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      .mockResolvedValueOnce({ data: { used: true }, error: null });

    const result = await verifyInviteCode('ABCD1234');

    expect(result.status).toBe('used');
  });

  it('returns invalid status when code does not exist at all', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      .mockResolvedValueOnce({ data: null, error: null });

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
    ).rejects.toEqual(expect.objectContaining({ message: 'Email already registered' }));
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
