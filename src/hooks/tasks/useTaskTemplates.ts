import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface TaskTemplate {
  id: string;
  tenant_id: string;
  name: string | null;
  name_ar: string | null;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  priority: string;
  visibility: string;
  estimated_minutes: number | null;
  checklist_items: any[];
  department_id: string | null;
  assignee_id: string | null;
  reviewer_id: string | null;
  approver_id: string | null;
  initiative_id: string | null;
  objective_id: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  source_type: string;
}

export interface CreateTemplateInput {
  name: string;
  name_ar?: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  priority?: string;
  visibility?: string;
  estimated_minutes?: number | null;
  checklist_items?: any[];
  department_id?: string | null;
}

const QUERY_KEY = 'manual-task-templates';

export function useTaskTemplates() {
  const { t } = useTranslation();
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const qc = useQueryClient();

  const { data: templates = [], isPending } = useQuery({
    queryKey: [QUERY_KEY, tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('source_type', 'manual_template')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TaskTemplate[];
    },
    enabled: !!tenantId,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { error } = await supabase.from('task_templates').insert({
        tenant_id: tenantId!,
        name: input.name,
        name_ar: input.name_ar || null,
        title: input.title,
        title_ar: input.title_ar || null,
        description: input.description || null,
        description_ar: input.description_ar || null,
        priority: input.priority || 'medium',
        visibility: input.visibility || 'department',
        estimated_minutes: input.estimated_minutes ?? null,
        checklist_items: input.checklist_items || [],
        department_id: input.department_id || null,
        source_type: 'manual_template',
        recurrence_pattern: 'daily', // required field, not used for manual templates
        created_by: employee?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(t('taskTemplates.created'));
    },
    onError: () => toast.error(t('taskTemplates.createError')),
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTemplateInput> & { id: string }) => {
      const { error } = await supabase
        .from('task_templates')
        .update({
          name: input.name,
          name_ar: input.name_ar,
          title: input.title,
          title_ar: input.title_ar,
          description: input.description,
          description_ar: input.description_ar,
          priority: input.priority,
          visibility: input.visibility,
          estimated_minutes: input.estimated_minutes,
          checklist_items: input.checklist_items,
          department_id: input.department_id,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(t('taskTemplates.updated'));
    },
    onError: () => toast.error(t('taskTemplates.updateError')),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_templates')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success(t('taskTemplates.deleted'));
    },
    onError: () => toast.error(t('taskTemplates.deleteError')),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('task_templates')
        .update({ is_active: active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });

  return {
    templates,
    isPending,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleActive,
    activeTemplates: templates.filter(t => t.is_active),
  };
}
