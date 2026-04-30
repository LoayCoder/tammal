import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockNavigate = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

let authState = {
  user: null as null | { id: string },
  loading: false,
  signIn: mockSignIn,
  signUp: mockSignUp,
};

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/hooks/org/usePlatformSettings', () => ({
  usePlatformSettings: () => ({ allowSignup: true, showInvitation: true, isPending: false }),
}));

vi.mock('@/hooks/branding/useBranding', () => ({
  useBranding: () => ({ branding: {} }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

vi.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => React.createElement('div') }));
vi.mock('@/components/LanguageSelector', () => ({ LanguageSelector: () => React.createElement('div') }));
vi.mock('@/components/pwa/PWAInstallBanner', () => ({ PWAInstallBanner: () => React.createElement('div') }));
vi.mock('@/components/branding/ThemeLogo', () => ({ ThemeLogo: () => React.createElement('div') }));

import Auth from '@/pages/Auth';

describe('Auth page flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: null, loading: false, signIn: mockSignIn, signUp: mockSignUp };
    mockSignIn.mockResolvedValue({ error: null });
    mockSignUp.mockResolvedValue({ error: null });
  });

  it('submits login and calls signIn', async () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Auth)));

    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.login' }));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('a@b.com', 'Password1'));
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('submits signup and returns to login mode', async () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Auth)));

    fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));
    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'new@b.com' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'Password1' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('new@b.com', 'Password1'));
    expect(screen.getByRole('button', { name: 'auth.login' })).toBeTruthy();
  });

  it('blocks signup when password confirmation mismatches', async () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Auth)));

    fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));
    fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'new@b.com' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'Password1' } });
    fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'auth.signup' }));

    await waitFor(() => expect(screen.getByText('auth.passwordMismatch')).toBeTruthy());
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});
