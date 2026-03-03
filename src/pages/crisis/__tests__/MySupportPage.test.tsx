import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MySupportPage from '../MySupportPage';

// ─── Mock hooks ──────────────────────────────────────────────────────
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, session: {} }),
}));

const mockCases = [
  {
    id: 'case-1',
    requester_user_id: 'user-1',
    intent: 'talk',
    status: 'active',
    created_at: '2026-03-01T10:00:00Z',
    tenant_id: 'tenant-1',
    summary: null,
  },
  {
    id: 'case-2',
    requester_user_id: 'user-1',
    intent: 'talk_to_someone',
    status: 'pending_first_aider_acceptance',
    created_at: '2026-03-02T14:00:00Z',
    tenant_id: 'tenant-1',
    summary: null,
  },
  {
    id: 'case-3',
    requester_user_id: 'user-1',
    intent: 'self_harm',
    status: 'resolved',
    created_at: '2026-02-20T08:00:00Z',
    tenant_id: 'tenant-1',
    summary: 'Follow-up recommended.',
  },
  {
    id: 'case-4',
    requester_user_id: 'user-1',
    intent: 'completely_unknown_intent',
    status: 'active',
    created_at: '2026-03-03T09:00:00Z',
    tenant_id: 'tenant-1',
    summary: null,
  },
];

vi.mock('@/hooks/crisis/useCrisisSupport', () => ({
  useCrisisCases: () => ({
    cases: mockCases,
    isPending: false,
    updateCaseStatus: { mutateAsync: vi.fn() },
  }),
}));

// Minimal i18n mock that returns translated values for known keys, fallback for unknown
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'crisisSupport.mySupport.title': 'My Support',
        'crisisSupport.mySupport.subtitle': 'Track your support requests',
        'crisisSupport.mySupport.newRequest': 'New Request',
        'crisisSupport.mySupport.activeCases': 'Active Cases',
        'crisisSupport.mySupport.history': 'History',
        'crisisSupport.mySupport.sharedNotes': 'Shared Notes',
        'crisisSupport.intents.talk': 'Talk to Someone',
        'crisisSupport.intents.talk_to_someone': 'Talk to Someone',
        'crisisSupport.intents.self_harm': 'Self Harm',
        'crisisSupport.statuses.active': 'Active',
        'crisisSupport.statuses.pending_first_aider_acceptance': 'Awaiting Acceptance',
        'crisisSupport.statuses.resolved': 'Resolved',
        'common.noData': 'No data',
      };
      return translations[key] ?? fallback ?? key;
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MySupportPage />
    </MemoryRouter>,
  );
}

// ─── Tests ───────────────────────────────────────────────────────────
describe('MySupportPage — label display', () => {
  beforeEach(() => {
    renderPage();
  });

  it('renders the page title correctly', () => {
    expect(screen.getByText('My Support')).toBeInTheDocument();
  });

  it('shows translated intent labels, never raw keys', () => {
    // "talk" intent → "Talk to Someone"
    const talkLabels = screen.getAllByText('Talk to Someone');
    expect(talkLabels.length).toBeGreaterThanOrEqual(1);

    // Raw translation key paths must NOT appear
    const rawKeyPattern = /crisisSupport\./;
    const allText = document.body.textContent || '';
    expect(allText).not.toMatch(rawKeyPattern);
  });

  it('shows translated status badges', () => {
    expect(screen.getAllByText('Active').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Awaiting Acceptance')).toBeInTheDocument();
  });

  it('falls back gracefully for unknown intents', () => {
    // Unknown intent should show the raw intent string, not the full key path
    expect(screen.getByText('completely_unknown_intent')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('crisisSupport.intents.completely_unknown_intent');
  });
});
