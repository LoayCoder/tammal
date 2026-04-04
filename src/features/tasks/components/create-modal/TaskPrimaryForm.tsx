import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { TaskChecklist, type ChecklistItem } from '../TaskChecklist';
import { TaskAttachments } from '../TaskAttachments';
import { TaskTemplatePicker } from '../TaskTemplatePicker';

interface LocalFile { file: File; }

interface TaskPrimaryFormProps {
  titleId: string;
  titleArId: string;
  descId: string;
  descArId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  onTitleChange: (v: string) => void;
  onTitleArChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDescriptionArChange: (v: string) => void;
  checklistItems: ChecklistItem[];
  onChecklistChange: (items: ChecklistItem[]) => void;
  files: LocalFile[];
  onFilesChange: (files: LocalFile[]) => void;
  onTemplateSelect: (tpl: any) => void;
  validationErrors?: Record<string, boolean>;
}

export function TaskPrimaryForm({
  titleId, titleArId, descId, descArId,
  title, titleAr, description, descriptionAr,
  onTitleChange, onTitleArChange, onDescriptionChange, onDescriptionArChange,
  checklistItems, onChecklistChange,
  files, onFilesChange, onTemplateSelect,
  validationErrors,
}: TaskPrimaryFormProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <TaskTemplatePicker onSelect={onTemplateSelect} />
      <Separator />

      <div className="space-y-1.5">
        <Label htmlFor={titleId}>{t('tasks.fields.title')} *</Label>
        <Input id={titleId} value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder={t('tasks.fields.titlePlaceholder')} aria-required="true" className={validationErrors?.title ? 'border-destructive' : ''} />
        {validationErrors?.title && <p className="text-2xs text-destructive">{t('tasks.validation.titleRequired')}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={titleArId}>{t('tasks.fields.titleAr')} *</Label>
        <Input id={titleArId} value={titleAr} onChange={(e) => onTitleArChange(e.target.value)} placeholder={t('tasks.fields.titleArPlaceholder')} dir="rtl" aria-required="true" className={validationErrors?.titleAr ? 'border-destructive' : ''} />
        {validationErrors?.titleAr && <p className="text-2xs text-destructive">{t('tasks.validation.titleArRequired')}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={descId}>{t('tasks.fields.description')} *</Label>
        <Textarea id={descId} value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder={t('tasks.fields.descriptionPlaceholder')} rows={4} aria-required="true" className={validationErrors?.description ? 'border-destructive' : ''} />
        {validationErrors?.description && <p className="text-2xs text-destructive">{t('tasks.validation.descriptionRequired')}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={descArId}>{t('tasks.fields.descriptionAr')} *</Label>
        <Textarea id={descArId} value={descriptionAr} onChange={(e) => onDescriptionArChange(e.target.value)} placeholder={t('tasks.fields.descriptionArPlaceholder')} rows={4} dir="rtl" aria-required="true" className={validationErrors?.descriptionAr ? 'border-destructive' : ''} />
        {validationErrors?.descriptionAr && <p className="text-2xs text-destructive">{t('tasks.validation.descriptionArRequired')}</p>}
      </div>

      <TaskAttachments files={files} onChange={onFilesChange} />
      <TaskChecklist items={checklistItems} onChange={onChecklistChange} />
    </div>
  );
}
