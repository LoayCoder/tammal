import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase ──
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockSignUp = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockGt = vi.fn();
const mockSelectChain = vi.fn();

function buildChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.is = vi.fn().mockReturnValue(chain);
  chain.gt = vi.fn().mockReturnValue(chain);
  chain.single = mockSingle;
  chain.insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
  chain.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  return chain;
}

const chain = buildChain();

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
});

describe('verifyInviteCode', () => {
  it('returns valid status with invitation data', async () => {
    mockSingle.mockResolvedValueOnce({ data: VALID_INVITATION, error: null });

    const result = await verifyInviteCode('abcd1234');

    expect(result.status).toBe('valid');
    if (result.status === 'valid') {
      expect(result.invitation.email).toBe('test@example.com');
      expect(result.invitation.tenant_id).toBe('tenant-1');
    }
  });

  it('uppercases the code before querying', async () => {
    mockSingle.mockResolvedValueOnce({ data: VALID_INVITATION, error: null });

    await verifyInviteCode('abcd1234');

    // The chain.eq was called — we verify code was uppercased via the service logic
    expect(chain.eq).toHaveBeenCalledWith('code', 'ABCD1234');
  });

  it('returns used status when invitation already consumed', async () => {
    // First query fails (active invite not found)
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      // Second query finds used invite
      .mockResolvedValueOnce({ data: { used: true }, error: null });

    const result = await verifyInviteCode('ABCD1234');

    expect(result.status).toBe('used');
  });

  it('returns invalid status when code does not exist', async () => {
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await verifyInviteCode('ZZZZZZZZ');

    expect(result.status).toBe('invalid');
  });
});

describe('acceptInvite', () => {
  it('creates user, updates profile, marks invite used, assigns role', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'new-user-id' } },
      error: null,
    });

    // All subsequent from() calls succeed via chain defaults
    mockSingle.mockResolvedValue({ data: { id: 'emp-new' }, error: null });
    chain.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    chain.insert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'emp-new' }, error: null }) }),
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
      expect.objectContaining({
        email: 'test@example.com',
        password: 'SecurePass123!',
      })
    );
  });

  it('throws when signup fails', async () => {
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

  it('throws when user object is null (no error but failed)', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null },
      error: null,
    });

    await expect(
      acceptInvite({
        invitation: VALID_INVITATION,
        fullName: 'Test',
        password: 'pass',
        redirectUrl: 'https://app.test',
      })
    ).rejects.toThrow('User creation failed');
  });

  it('links existing employee when employee_id is provided', async () => {
    const inviteWithEmployee = { ...VALID_INVITATION, employee_id: 'existing-emp' };

    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: 'uid-123' } },
      error: null,
    });

    chain.update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    chain.insert = vi.fn().mockReturnValue({ error: null });

    await expect(
      acceptInvite({
        invitation: inviteWithEmployee,
        fullName: 'Existing Employee',
        password: 'pass123!',
        redirectUrl: 'https://app.test',
      })
    ).resolves.toBeUndefined();
  });
});
