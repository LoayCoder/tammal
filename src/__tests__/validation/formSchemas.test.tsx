import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

vi.mock('@/hooks/org/useTenantInvitations', () => ({
  useTenantInvitations: () => ({ createInvitation: vi.fn(), isCreating: false }),
}));

vi.mock('@/hooks/auth/useRoles', () => ({
  useRoles: () => ({ roles: [], isPending: false }),
}));

import { InviteUserDialog } from '@/components/users/InviteUserDialog';
import RiskMappingDialog from '@/components/crisis/RiskMappingDialog';

describe('form validation (zod) sample', () => {
  it('InviteUserDialog rejects invalid invite payload', async () => {
    render(
      React.createElement(InviteUserDialog, {
        open: true,
        onOpenChange: vi.fn(),
        tenantId: 't1',
      }),
    );
    fireEvent.change(screen.getByLabelText(/users.email/i), { target: { value: 'not-email' } });
    fireEvent.click(screen.getByRole('button', { name: 'invitations.sendInvitation' }));
    expect(await screen.findByText('Please enter a valid email address')).toBeTruthy();
  });

  it('RiskMappingDialog rejects empty intent', async () => {
    const onSubmit = vi.fn();
    render(
      React.createElement(RiskMappingDialog, {
        open: true,
        onOpenChange: vi.fn(),
        mapping: null,
        onSubmit,
        isPending: false,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.create' }));
    expect(await screen.findByText('Intent is required')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
