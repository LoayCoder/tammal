import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X } from 'lucide-react';
import { ReferenceFramework } from '@/hooks/useReferenceFrameworks';

interface FrameworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework?: ReferenceFramework | null;
  onSave: (data: { id?: string; name: string; name_ar?: string; description?: string; description_ar?: string; icon?: string; framework_key: string; files?: File[] }) => void;
}

export function FrameworkDialog({ open, onOpenChange, framework, onSave }: FrameworkDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [icon, setIcon] = useState('📋');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (framework) {
      setName(framework.name);
      setNameAr(framework.name_ar || '');
      setDescription(framework.description || '');
      setDescriptionAr(framework.description_ar || '');
      setIcon(framework.icon || '📋');
    } else {
      setName('');
      setNameAr('');
      setDescription('');
      setDescriptionAr('');
      setIcon('📋');
    }
    setPendingFiles([]);
  }, [framework, open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const key = framework?.framework_key || name.trim().replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    onSave({
      ...(framework ? { id: framework.id } : {}),
      name: name.trim(),
      name_ar: nameAr.trim() || undefined,
      description: description.trim() || undefined,
      description_ar: descriptionAr.trim() || undefined,
      icon: icon || '📋',
      framework_key: key,
      files: pendingFiles.length > 0 ? pendingFiles : undefined,
    });
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const valid = Array.from(files).filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return allowed.includes(ext);
    });
    setPendingFiles(prev => [...prev, ...valid]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{framework ? t('aiGenerator.editFramework') : t('aiGenerator.addFramework')}</DialogTitle>
          <DialogDescription>{framework ? t('aiGenerator.editFrameworkDesc') : t('aiGenerator.addFrameworkDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('aiGenerator.frameworkIcon')}</Label>
              <Input value={icon} onChange={e => setIcon(e.target.value)} className="w-14 text-center text-lg" maxLength={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('aiGenerator.frameworkName')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., ISO 45003" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('aiGenerator.frameworkNameAr')}</Label>
            <Input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" placeholder="الاسم بالعربية" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('aiGenerator.frameworkDescription')}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[60px] text-xs" placeholder="Describe how this framework guides question generation..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('aiGenerator.frameworkDescriptionAr')}</Label>
            <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} className="min-h-[60px] text-xs" dir="rtl" placeholder="وصف الإطار المرجعي بالعربية..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('aiGenerator.frameworkDocuments')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 me-1" />
              {t('aiGenerator.uploadDoc')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md"
              multiple
              onChange={handleFileSelect}
            />
            {pendingFiles.length > 0 && (
              <div className="space-y-1 mt-1">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1 rounded bg-muted/30 border border-border/30 text-[10px]">
                    <FileText className="h-3 w-3 text-primary shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{(f.size / 1024).toFixed(0)}KB</Badge>
                    <button type="button" onClick={() => removeFile(i)} className="p-0.5 hover:bg-destructive/10 rounded">
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
