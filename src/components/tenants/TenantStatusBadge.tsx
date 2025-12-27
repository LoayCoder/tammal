import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface TenantStatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  active: { variant: 'default', className: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30' },
  trial: { variant: 'secondary', className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  suspended: { variant: 'destructive', className: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30' },
  inactive: { variant: 'outline', className: 'bg-muted text-muted-foreground' },
};

export function TenantStatusBadge({ status }: TenantStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <Badge variant={config.variant} className={config.className}>
      {t(`common.${status}`)}
    </Badge>
  );
}
