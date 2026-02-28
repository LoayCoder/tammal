/**
 * CheckinSuccess — Component Smoke Test
 *
 * Validates the success/already-done states render correctly.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: 'en' },
  }),
}));

import { CheckinSuccess } from '@/components/checkin/CheckinSuccess';

describe('CheckinSuccess — Smoke', () => {
  it('renders streak and points', () => {
    render(React.createElement(CheckinSuccess, { streak: 5, totalPoints: 120, aiTip: null }));
    expect(screen.getByText(/5/)).toBeTruthy();
    expect(screen.getByText(/120/)).toBeTruthy();
    expect(screen.getByText('wellness.thankYou')).toBeTruthy();
  });

  it('renders AI tip when provided', () => {
    render(React.createElement(CheckinSuccess, { streak: 1, totalPoints: 10, aiTip: 'Take a walk today' }));
    expect(screen.getByText('Take a walk today')).toBeTruthy();
  });

  it('does not render tip card when aiTip is null', () => {
    render(React.createElement(CheckinSuccess, { streak: 1, totalPoints: 10, aiTip: null }));
    expect(screen.queryByText('wellness.yourTip')).toBeNull();
  });

  it('shows already-done message when alreadyDone=true', () => {
    render(React.createElement(CheckinSuccess, { streak: 3, totalPoints: 50, aiTip: null, alreadyDone: true }));
    expect(screen.getByText("You've already checked in today!")).toBeTruthy();
    expect(screen.getByText('Come back tomorrow to continue your streak!')).toBeTruthy();
  });

  it('shows celebration emoji for new check-in, checkmark for already done', () => {
    const { container: newContainer } = render(
      React.createElement(CheckinSuccess, { streak: 1, totalPoints: 10, aiTip: null })
    );
    expect(newContainer.textContent).toContain('🎉');

    const { container: doneContainer } = render(
      React.createElement(CheckinSuccess, { streak: 1, totalPoints: 10, aiTip: null, alreadyDone: true })
    );
    expect(doneContainer.textContent).toContain('✅');
  });
});
