import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageErrorBoundary } from '../PageErrorBoundary';

// A component that throws on render
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test explosion');
  return <div>Healthy content</div>;
};

// Suppress console.error noise from React error boundaries in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('PageErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <PageErrorBoundary routeGroup="admin">
        <div>Admin page</div>
      </PageErrorBoundary>
    );
    expect(screen.getByText('Admin page')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <PageErrorBoundary routeGroup="admin">
        <ThrowingComponent shouldThrow={true} />
      </PageErrorBoundary>
    );
    // Fallback card renders with buttons (text may vary by i18n)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
    // Original content should NOT be visible
    expect(screen.queryByText('Healthy content')).not.toBeInTheDocument();
  });

  it('resets state on Retry click', () => {
    // We verify the boundary resets internal hasError state.
    // After reset, if child no longer throws, healthy content renders.
    const throwRef = { current: true };

    const ConditionalThrower = () => {
      if (throwRef.current) throw new Error('boom');
      return <div>Healthy content</div>;
    };

    const { rerender } = render(
      <PageErrorBoundary routeGroup="admin">
        <ConditionalThrower />
      </PageErrorBoundary>
    );
    // Fallback is showing
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);

    // Stop throwing, then click Retry
    throwRef.current = false;
    fireEvent.click(screen.getAllByRole('button')[0]);

    // Force React to re-render with the boundary now reset
    rerender(
      <PageErrorBoundary routeGroup="admin">
        <ConditionalThrower />
      </PageErrorBoundary>
    );

    expect(screen.getByText('Healthy content')).toBeInTheDocument();
  });

  it('does not crash the outer tree', () => {
    render(
      <div>
        <div>Outer sibling</div>
        <PageErrorBoundary routeGroup="toolkit">
          <ThrowingComponent shouldThrow={true} />
        </PageErrorBoundary>
      </div>
    );
    // Outer sibling survives
    expect(screen.getByText('Outer sibling')).toBeInTheDocument();
    // Boundary catches the crash — buttons rendered
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(2);
  });
});
