import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { Upload, X, FileText, Image, File } from 'lucide-react';

interface LocalFile {
  file: File;
  preview?: string;
}

interface TaskAttachmentsProps {
  files: LocalFile[];
  onChange: (files: LocalFile[]) => void;
  disabled?: boolean;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-4 w-4 text-chart-2" />;
  if (type.includes('pdf')) return <FileText className="h-4 w-4 text-destructive" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskAttachments({ files, onChange, disabled }: TaskAttachmentsProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({ file }));
    onChange([...files, ...newFiles]);
  }, [files, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = useCallback((index: number) => {
    onChange(files.filter((_, i) => i !== index));
  }, [files, onChange]);

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{t('tasks.attachments.title')}</span>
      {!disabled && (
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-xs text-muted-foreground">{t('tasks.attachments.dragDrop')}</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>
      )}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/50 text-sm">
              {getFileIcon(f.file.type)}
              <span className="flex-1 truncate">{f.file.name}</span>
              <span className="text-xs text-muted-foreground">{formatSize(f.file.size)}</span>
              {!disabled && (
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(i)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
