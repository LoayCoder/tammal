import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import {
  Plug, Unplug, RefreshCw, ExternalLink, CheckCircle2, XCircle,
  FileSpreadsheet, Upload,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';

interface Connector {
  id: string;
  provider: string;
  status: string;
  last_sync_at: string | null;
  config: Record<string, unknown>;
}

const PROVIDERS = [
  { id: 'microsoft_todo', name: 'Microsoft To Do', icon: '📋', available: false },
  { id: 'jira', name: 'Jira', icon: '🔷', available: false },
  { id: 'asana', name: 'Asana', icon: '🟠', available: false },
  { id: 'monday', name: 'Monday.com', icon: '🟣', available: false },
  { id: 'clickup', name: 'ClickUp', icon: '🟢', available: false },
  { id: 'manual_import', name: 'Manual Import (CSV)', icon: '📂', available: true },
];

export default function TaskConnectors() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const queryClient = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);
  const [csvText, setCsvText] = useState('');

  const connectorsQuery = useQuery({
    queryKey: ['task-connectors', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_connectors')
        .select('*')
        .is('deleted_at', null);
      if (error) throw error;
      return data as Connector[];
    },
    enabled: !!tenantId,
  });

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      if (!employee) throw new Error('No employee profile');
      const lines = csv.trim().split('\n').filter(l => l.trim());
      if (lines.length < 2) throw new Error('CSV must have header + data');
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const titleIdx = headers.indexOf('title');
      const descIdx = headers.indexOf('description');
      const priorityIdx = headers.indexOf('priority');
      const estIdx = headers.indexOf('estimated_minutes');
      const dueIdx = headers.indexOf('due_date');

      if (titleIdx === -1) throw new Error('CSV must have a "title" column');

      const tasks = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim());
        return {
          tenant_id: employee.tenant_id,
          employee_id: employee.id,
          title: cols[titleIdx] || 'Untitled',
          description: descIdx >= 0 ? cols[descIdx] || null : null,
          priority: priorityIdx >= 0 ? parseInt(cols[priorityIdx]) || 3 : 3,
          estimated_minutes: estIdx >= 0 ? parseInt(cols[estIdx]) || null : null,
          due_date: dueIdx >= 0 && cols[dueIdx] ? cols[dueIdx] : null,
          source_type: 'external' as const,
          status: 'todo' as const,
        };
      });

      const { error } = await supabase.from('unified_tasks').insert(tasks);
      if (error) throw error;
      return tasks.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('connectors.importSuccess', { count }));
      setImportOpen(false);
      setCsvText('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const connectors = connectorsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('connectors.pageTitle')}</h1>
        <p className="text-muted-foreground text-sm">{t('connectors.pageDesc')}</p>
      </div>

      {/* Connected */}
      {connectors.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('connectors.connected')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectors.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-chart-1" />
                  <span className="font-medium text-sm capitalize">{c.provider.replace('_', ' ')}</span>
                </div>
                <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="text-xs">{c.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Available Connectors */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map(provider => {
          const isConnected = connectors.some(c => c.provider === provider.id);
          return (
            <Card key={provider.id} className="glass-card border-0">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isConnected ? t('connectors.connected') : provider.available ? t('connectors.available') : t('connectors.comingSoon')}
                    </p>
                  </div>
                </div>
                {provider.id === 'manual_import' ? (
                  <Button size="sm" className="w-full gap-2" onClick={() => setImportOpen(true)}>
                    <Upload className="h-3.5 w-3.5" />{t('connectors.importCSV')}
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" className="w-full gap-2" disabled>
                    <Plug className="h-3.5 w-3.5" />{t('connectors.comingSoon')}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CSV Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('connectors.importTitle')}</DialogTitle>
            <DialogDescription>{t('connectors.importDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs font-mono">
              title,description,priority,estimated_minutes,due_date<br />
              Fix login bug,Auth issue with SSO,1,120,2026-03-01<br />
              Review docs,Q1 documentation review,3,60,
            </div>
            <div className="space-y-2">
              <Label>{t('connectors.csvData')}</Label>
              <Textarea
                rows={8}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder="title,description,priority,estimated_minutes,due_date"
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={() => importMutation.mutate(csvText)}
              disabled={!csvText.trim() || importMutation.isPending}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {importMutation.isPending ? t('common.loading') : t('connectors.importBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
