import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ImportTasksInput {
  csv: string;
  tenantId: string;
  employeeId: string;
}

export function useTaskImport() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const importTasks = useMutation({
    mutationFn: async ({ csv, tenantId, employeeId }: ImportTasksInput) => {
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
          tenant_id: tenantId,
          employee_id: employeeId,
          title: cols[titleIdx] || 'Untitled',
          description: descIdx >= 0 ? cols[descIdx] || null : null,
          priority: priorityIdx >= 0 ? parseInt(cols[priorityIdx]) || 3 : 3,
          estimated_minutes: estIdx >= 0 ? parseInt(cols[estIdx]) || null : null,
          due_date: dueIdx >= 0 && cols[dueIdx] ? cols[dueIdx] : null,
          source_type: 'external' as const,
          status: 'draft' as const,
        };
      });

      const { error } = await supabase.from('unified_tasks').insert(tasks);
      if (error) throw error;
      return tasks.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['unified-tasks'] });
      toast.success(t('connectors.importSuccess', { count }));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { importTasks };
}
