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
    // Fallback should show the error card
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
    // Original content should NOT be visible
    expect(screen.queryByText('Healthy content')).not.toBeInTheDocument();
  });

  it('resets and re-renders children on Retry click', () => {
    let shouldThrow = true;
    const Wrapper = () => (
      <PageErrorBoundary routeGroup="admin">
        <ThrowingComponent shouldThrow={shouldThrow} />
      </PageErrorBoundary>
    );

    const { rerender } = render(<Wrapper />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // "Fix" the child before retrying
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    rerender(<Wrapper />);

    expect(screen.getByText('Healthy content')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
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
    // Boundary catches the crash
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
