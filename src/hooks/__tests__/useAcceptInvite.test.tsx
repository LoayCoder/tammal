/**
 * useAcceptInvite — Hook Contract Tests
 *
 * Validates:
 * - Step transitions (code → signup → success)
 * - Service delegation (no inline logic)
 * - Error handling per step
 * - Loading state transitions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// ── Mock dependencies ──
const mockVerifyInviteCode = vi.fn();
const mockAcceptInvite = vi.fn();
const mockToastError = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/services/inviteService', () => ({
  verifyInviteCode: (...args: unknown[]) => mockVerifyInviteCode(...args),
  acceptInvite: (...args: unknown[]) => mockAcceptInvite(...args),
}));

vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args), success: vi.fn(), info: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

import { useAcceptInvite } from '@/hooks/auth/useAcceptInvite';
import type { InvitationData } from '@/services/inviteService';

const fakeInvitation: InvitationData = {
  id: 'inv-1',
  code: 'ABC123',
  email: 'test@example.com',
  full_name: 'Test User',
  tenant_id: 't-1',
  employee_id: 'emp-1',
  tenants: { name: 'Acme' },
};

describe('useAcceptInvite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── verifyCode success ──

  it('transitions to signup step on valid code', async () => {
    mockVerifyInviteCode.mockResolvedValue({ status: 'valid', invitation: fakeInvitation });

    const { result } = renderHook(() => useAcceptInvite());
    expect(result.current.step).toBe('code');

    await act(async () => {
      await result.current.verifyCode('abc123');
    });

    expect(result.current.step).toBe('signup');
    expect(result.current.invitation).toEqual(fakeInvitation);
    expect(result.current.codeError).toBe('');
    expect(result.current.isVerifying).toBe(false);
  });

  // ── verifyCode — used code ──

  it('sets codeError for used invitation', async () => {
    mockVerifyInviteCode.mockResolvedValue({ status: 'used' });

    const { result } = renderHook(() => useAcceptInvite());

    await act(async () => {
      await result.current.verifyCode('USED1');
    });

    expect(result.current.codeError).toBe('acceptInvite.codeUsed');
    expect(result.current.step).toBe('code');
  });

  // ── verifyCode — invalid code ──

  it('sets codeError for invalid code', async () => {
    mockVerifyInviteCode.mockResolvedValue({ status: 'invalid' });

    const { result } = renderHook(() => useAcceptInvite());

    await act(async () => {
      await result.current.verifyCode('NOPE');
    });

    expect(result.current.codeError).toBe('acceptInvite.invalidCode');
  });

  // ── verifyCode — thrown error ──

  it('handles service throw during verify', async () => {
    mockVerifyInviteCode.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useAcceptInvite());

    await act(async () => {
      await result.current.verifyCode('ERR');
    });

    expect(result.current.codeError).toBe('acceptInvite.invalidCode');
    expect(result.current.isVerifying).toBe(false);
  });

  // ── handleSignup success ──

  it('transitions to success step on accepted invite', async () => {
    mockVerifyInviteCode.mockResolvedValue({ status: 'valid', invitation: fakeInvitation });
    mockAcceptInvite.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAcceptInvite());

    // First verify
    await act(async () => {
      await result.current.verifyCode('ABC123');
    });

    // Then signup
    await act(async () => {
      await result.current.handleSignup('Test User', 'P@ssw0rd');
    });

    expect(result.current.step).toBe('success');
    expect(result.current.isSubmitting).toBe(false);
    expect(mockAcceptInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        invitation: fakeInvitation,
        fullName: 'Test User',
        password: 'P@ssw0rd',
      }),
    );
  });

  // ── handleSignup error ──

  it('shows toast error on signup failure', async () => {
    mockVerifyInviteCode.mockResolvedValue({ status: 'valid', invitation: fakeInvitation });
    mockAcceptInvite.mockRejectedValue(new Error('Email taken'));

    const { result } = renderHook(() => useAcceptInvite());

    await act(async () => {
      await result.current.verifyCode('ABC123');
    });

    await act(async () => {
      await result.current.handleSignup('User', 'pass');
    });

    expect(mockToastError).toHaveBeenCalledWith('Email taken');
    expect(result.current.step).toBe('signup'); // stays on signup
    expect(result.current.isSubmitting).toBe(false);
  });

  // ── handleSignup does nothing without invitation ──

  it('does nothing if invitation is null', async () => {
    const { result } = renderHook(() => useAcceptInvite());

    await act(async () => {
      await result.current.handleSignup('User', 'pass');
    });

    expect(mockAcceptInvite).not.toHaveBeenCalled();
  });

  // ── goToLogin ──

  it('navigates to /auth', () => {
    const { result } = renderHook(() => useAcceptInvite());
    result.current.goToLogin();
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });
});
