import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useTaskTemplates } from '@/features/tasks/hooks/useTaskTemplates';

interface TaskTemplatePickerProps {
  onSelect: (template: {
    title: string;
    title_ar: string | null;
    description: string | null;
    priority: string;
    visibility: string;
    estimated_minutes: number | null;
    checklist_items: any[];
    department_id: string | null;
  }) => void;
}

export function TaskTemplatePicker({ onSelect }: TaskTemplatePickerProps) {
  const { t } = useTranslation();
  const { activeTemplates, isPending } = useTaskTemplates();

  if (isPending || activeTemplates.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        {t('taskTemplates.useTemplate')}
      </label>
      <Select
        onValueChange={(id) => {
          const tpl = activeTemplates.find(t => t.id === id);
          if (tpl) {
            onSelect({
              title: tpl.title,
              title_ar: tpl.title_ar,
              description: tpl.description,
              priority: tpl.priority,
              visibility: tpl.visibility,
              estimated_minutes: tpl.estimated_minutes,
              checklist_items: Array.isArray(tpl.checklist_items) ? tpl.checklist_items : [],
              department_id: tpl.department_id,
            });
          }
        }}
      >
        <SelectTrigger className="h-9">
          <SelectValue placeholder={t('taskTemplates.selectTemplate')} />
        </SelectTrigger>
        <SelectContent>
          {activeTemplates.map(tpl => (
            <SelectItem key={tpl.id} value={tpl.id}>
              {tpl.name || tpl.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
