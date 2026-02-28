import React, { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  /** Main title */
  title: string;
  /** Optional secondary text */
  description?: string;
  /** Icon rendered above the title (defaults to Inbox) */
  icon?: ReactNode;
  /** Optional action button */
  actionLabel?: string;
  /** Callback for the action button */
  onAction?: () => void;
}

export const EmptyState = React.memo(function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        {icon ?? <Inbox className="h-7 w-7 text-muted-foreground" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-muted-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
});
