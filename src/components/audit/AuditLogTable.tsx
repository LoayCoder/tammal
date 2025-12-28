import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Plus, Edit, Trash2, ToggleLeft, RefreshCw, 
  Building2, CreditCard, Users, Layers, Eye 
} from 'lucide-react';
import type { AuditLog } from '@/hooks/useAuditLog';

interface AuditLogTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  compact?: boolean;
}

const actionIcons: Record<string, React.ElementType> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  module_toggle: ToggleLeft,
  status_change: RefreshCw,
};

const entityIcons: Record<string, React.ElementType> = {
  tenant: Building2,
  subscription: CreditCard,
  user: Users,
  plan: Layers,
};

const actionColors: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  update: 'bg-blue-500/10 text-blue-600 border-blue-200',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  module_toggle: 'bg-amber-500/10 text-amber-600 border-amber-200',
  status_change: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

export function AuditLogTable({ logs, isLoading, compact = false }: AuditLogTableProps) {
  const { t } = useTranslation();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const formatChanges = (changes: Record<string, any> | null) => {
    if (!changes || Object.keys(changes).length === 0) return '—';
    
    if (changes.before && changes.after) {
      const changedFields = Object.keys(changes.after).filter(
        key => JSON.stringify(changes.before[key]) !== JSON.stringify(changes.after[key])
      );
      return changedFields.length > 0 
        ? changedFields.join(', ')
        : '—';
    }
    
    if (changes.field) {
      return `${changes.field}: ${changes.old_value} → ${changes.new_value}`;
    }
    
    return Object.keys(changes).join(', ');
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(compact ? 5 : 10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-8">
        {t('audit.noLogs')}
      </p>
    );
  }

  if (compact) {
    return (
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {logs.map((log) => {
            const ActionIcon = actionIcons[log.action] || Edit;
            const EntityIcon = entityIcons[log.entity_type] || Building2;
            
            return (
              <div 
                key={log.id} 
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <div className={`p-2 rounded-full ${actionColors[log.action]}`}>
                  <ActionIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <EntityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-sm capitalize">
                      {t(`audit.actions.${log.action}`)} {t(`audit.entities.${log.entity_type}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {formatChanges(log.changes as Record<string, any>)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('audit.action')}</TableHead>
          <TableHead>{t('audit.entity')}</TableHead>
          <TableHead>{t('audit.changes')}</TableHead>
          <TableHead>{t('audit.timestamp')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const ActionIcon = actionIcons[log.action] || Edit;
          const EntityIcon = entityIcons[log.entity_type] || Building2;
          
          return (
            <TableRow key={log.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedLog(log)}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={actionColors[log.action]}
                  >
                    <ActionIcon className="h-3 w-3 me-1" />
                    {t(`audit.actions.${log.action}`)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EntityIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">
                    {t(`audit.entities.${log.entity_type}`)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <span className="text-sm text-muted-foreground truncate block">
                  {formatChanges(log.changes as Record<string, any>)}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{format(new Date(log.created_at), 'PP')}</p>
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(log.created_at), 'p')}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>

    <AuditLogDetailsModal 
      log={selectedLog} 
      open={!!selectedLog} 
      onOpenChange={(open) => !open && setSelectedLog(null)} 
    />
  </>
  );
}

interface AuditLogDetailsModalProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AuditLogDetailsModal({ log, open, onOpenChange }: AuditLogDetailsModalProps) {
  const { t } = useTranslation();

  if (!log) return null;

  const ActionIcon = actionIcons[log.action] || Edit;
  const EntityIcon = entityIcons[log.entity_type] || Building2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {t('audit.logDetails')}
          </DialogTitle>
          <DialogDescription>
            {format(new Date(log.created_at), 'PPpp')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={actionColors[log.action]}>
                <ActionIcon className="h-3 w-3 me-1" />
                {t(`audit.actions.${log.action}`)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <EntityIcon className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize text-sm">
                {t(`audit.entities.${log.entity_type}`)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('audit.entityId')}</h4>
            <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
              {log.entity_id}
            </code>
          </div>

          {log.user_id && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('audit.userId')}</h4>
              <code className="block p-2 bg-muted rounded text-xs font-mono break-all">
                {log.user_id}
              </code>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('audit.changes')}</h4>
            <ScrollArea className="h-[200px] rounded border">
              <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </ScrollArea>
          </div>

          {log.metadata && Object.keys(log.metadata as object).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{t('audit.metadata')}</h4>
              <ScrollArea className="h-[100px] rounded border">
                <pre className="p-4 text-xs font-mono whitespace-pre-wrap break-all">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
