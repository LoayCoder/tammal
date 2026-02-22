import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const [isDragging, setIsDragging] = useState(false);
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

  const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md'];

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const valid = files.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return allowed.includes(ext);
    });
    setPendingFiles(prev => [...prev, ...valid]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(files);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

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
          {/* Icon + Name row with icon preview */}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('aiGenerator.frameworkIcon')}</Label>
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {icon || '📋'}
                </div>
                <Input value={icon} onChange={e => setIcon(e.target.value)} className="w-14 text-center text-sm h-8" maxLength={2} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('aiGenerator.frameworkName')}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., ISO 45003" />
            </div>
          </div>

          <Separator className="my-1" />

          {/* Arabic name */}
          <div className="space-y-1">
            <Label className="text-xs">{t('aiGenerator.frameworkNameAr')}</Label>
            <Input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" placeholder="الاسم بالعربية" />
          </div>

          <Separator className="my-1" />

          {/* Description EN */}
          <div className="space-y-1">
            <Label className="text-xs">{t('aiGenerator.frameworkDescription')}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[60px] text-xs" placeholder="Describe how this framework guides question generation..." />
          </div>

          {/* Description AR */}
          <div className="space-y-1">
            <Label className="text-xs">{t('aiGenerator.frameworkDescriptionAr')}</Label>
            <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} className="min-h-[60px] text-xs" dir="rtl" placeholder="وصف الإطار المرجعي بالعربية..." />
          </div>

          <Separator className="my-1" />

          {/* File upload drop zone */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('aiGenerator.frameworkDocuments')}</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <Upload className={`h-5 w-5 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground">{t('aiGenerator.dragOrClick')}</span>
              <span className="text-[10px] text-muted-foreground/70">PDF, DOCX, DOC, TXT, MD</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.txt,.md"
              multiple
              onChange={handleFileSelect}
            />
            {pendingFiles.length > 0 && (
              <div className="space-y-1 mt-1.5">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1.5 rounded-md bg-muted/30 border border-border/30 text-[11px]">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{(f.size / 1024).toFixed(0)}KB</Badge>
                    <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-destructive/10 rounded">
                      <X className="h-3.5 w-3.5 text-destructive" />
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
