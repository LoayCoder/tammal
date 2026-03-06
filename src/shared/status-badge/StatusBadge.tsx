import { Badge, type BadgeProps } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface StatusBadgeEntry {
  variant?: BadgeProps['variant'];
  className?: string;
  icon?: LucideIcon;
  labelKey?: string;
}

export type StatusBadgeConfig = Record<string, StatusBadgeEntry>;

interface StatusBadgeProps {
  status: string;
  config: StatusBadgeConfig;
  translationPrefix?: string;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default';
}

export function StatusBadge({
  status,
  config,
  translationPrefix,
  label,
  showIcon = false,
  size = 'default',
}: StatusBadgeProps) {
  const { t } = useTranslation();
  const entry = config[status];
  if (!entry) {
    return <Badge variant="outline">{label ?? status}</Badge>;
  }

  const Icon = showIcon ? entry.icon : undefined;
  const text =
    label ??
    (entry.labelKey ? t(entry.labelKey) : translationPrefix ? t(`${translationPrefix}.${status}`) : status);

  return (
    <Badge
      variant={entry.variant ?? 'outline'}
      className={cn(
        showIcon && Icon && 'gap-1',
        size === 'sm' && 'text-2xs px-1.5 py-0',
        entry.className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {text}
    </Badge>
  );
}
