/**
 * AcceptInvite — E2E Smoke Test
 *
 * Happy path: enter code → verify → fill form → success
 * Error path: invalid code → error message shown
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// ── Mock hooks ──

const mockVerifyCode = vi.fn();
const mockHandleSignup = vi.fn();
const mockGoToLogin = vi.fn();

let hookState = {
  step: 'code' as 'code' | 'signup' | 'success',
  invitation: null as null | { id: string; email: string; full_name: string; tenant_id: string; employee_id: string; code: string; tenants: { name: string } },
  isVerifying: false,
  isSubmitting: false,
  codeError: '',
  verifyCode: mockVerifyCode,
  handleSignup: mockHandleSignup,
  goToLogin: mockGoToLogin,
};

vi.mock('@/hooks/auth/useAcceptInvite', () => ({
  useAcceptInvite: () => hookState,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  useNavigate: () => vi.fn(),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => React.createElement('div', { 'data-testid': 'theme-toggle' }),
}));

vi.mock('@/components/LanguageSelector', () => ({
  LanguageSelector: () => React.createElement('div', { 'data-testid': 'lang-selector' }),
}));

import AcceptInvite from '@/pages/auth/AcceptInvite';

describe('AcceptInvite — E2E Smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hookState = {
      step: 'code',
      invitation: null,
      isVerifying: false,
      isSubmitting: false,
      codeError: '',
      verifyCode: mockVerifyCode,
      handleSignup: mockHandleSignup,
      goToLogin: mockGoToLogin,
    };
  });

  it('renders code entry form on initial load', () => {
    render(React.createElement(AcceptInvite));
    expect(screen.getByText('acceptInvite.title')).toBeTruthy();
    expect(screen.getByLabelText('invitations.code')).toBeTruthy();
  });

  it('verify button is disabled when code < 8 chars', () => {
    render(React.createElement(AcceptInvite));
    const verifyBtn = screen.getByRole('button', { name: /acceptInvite.verifyCode/i });
    expect(verifyBtn).toBeDisabled();
  });

  it('calls verifyCode on form submit with 8-char code', async () => {
    render(React.createElement(AcceptInvite));
    const input = screen.getByLabelText('invitations.code');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'ABCD1234' } });
    });

    const verifyBtn = screen.getByRole('button', { name: /acceptInvite.verifyCode/i });
    expect(verifyBtn).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(verifyBtn);
    });

    expect(mockVerifyCode).toHaveBeenCalledWith('ABCD1234');
  });

  it('shows error message for invalid code', () => {
    hookState.codeError = 'acceptInvite.invalidCode';
    render(React.createElement(AcceptInvite));
    expect(screen.getByText('acceptInvite.invalidCode')).toBeTruthy();
  });

  it('renders signup form when step is signup', () => {
    hookState.step = 'signup';
    hookState.invitation = {
      id: 'inv-1',
      code: 'ABCD1234',
      email: 'user@acme.com',
      full_name: 'John',
      tenant_id: 't-1',
      employee_id: 'e-1',
      tenants: { name: 'Acme Corp' },
    };

    render(React.createElement(AcceptInvite));
    expect(screen.getByText('acceptInvite.createAccount')).toBeTruthy();
    expect(screen.getByDisplayValue('user@acme.com')).toBeTruthy();
    expect(screen.getByDisplayValue('John')).toBeTruthy();
  });

  it('calls handleSignup on valid form submit', async () => {
    hookState.step = 'signup';
    hookState.invitation = {
      id: 'inv-1', code: 'ABCD1234', email: 'user@acme.com',
      full_name: 'John', tenant_id: 't-1', employee_id: 'e-1',
      tenants: { name: 'Acme' },
    };

    render(React.createElement(AcceptInvite));

    const passwordInput = screen.getByLabelText('auth.password');
    const confirmInput = screen.getByLabelText('auth.confirmPassword');

    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'Str0ng!Pass' } });
      fireEvent.change(confirmInput, { target: { value: 'Str0ng!Pass' } });
    });

    const submitBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('acceptInvite.createAccount'));

    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    expect(mockHandleSignup).toHaveBeenCalledWith('John', 'Str0ng!Pass');
  });

  it('shows validation error for password mismatch', async () => {
    hookState.step = 'signup';
    hookState.invitation = {
      id: 'inv-1', code: 'ABCD1234', email: 'user@acme.com',
      full_name: 'John', tenant_id: 't-1', employee_id: 'e-1',
      tenants: { name: 'Acme' },
    };

    render(React.createElement(AcceptInvite));

    const passwordInput = screen.getByLabelText('auth.password');
    const confirmInput = screen.getByLabelText('auth.confirmPassword');

    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'Str0ng!Pass' } });
      fireEvent.change(confirmInput, { target: { value: 'different' } });
    });

    const submitBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('acceptInvite.createAccount'));
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    expect(screen.getByText('auth.passwordMismatch')).toBeTruthy();
    expect(mockHandleSignup).not.toHaveBeenCalled();
  });

  it('renders success screen with login button', () => {
    hookState.step = 'success';
    render(React.createElement(AcceptInvite));
    expect(screen.getByText('acceptInvite.accountCreated')).toBeTruthy();

    const loginBtn = screen.getByRole('button', { name: /auth.login/i });
    fireEvent.click(loginBtn);
    expect(mockGoToLogin).toHaveBeenCalled();
  });

  it('goToLogin link works from code step', () => {
    render(React.createElement(AcceptInvite));
    const link = screen.getByText(/auth.login/);
    fireEvent.click(link);
    expect(mockGoToLogin).toHaveBeenCalled();
  });
});
