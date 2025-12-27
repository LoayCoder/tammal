import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ImageDropzoneProps {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
  maxSizeKB?: number;
  previewSize?: 'sm' | 'md' | 'lg';
  hint?: string;
}

export function ImageDropzone({
  label,
  value,
  onChange,
  accept = 'image/*',
  maxSizeKB = 500,
  previewSize = 'md',
  hint,
}: ImageDropzoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError(t('branding.invalidFormat'));
        return;
      }

      // Validate file size
      if (file.size > maxSizeKB * 1024) {
        setError(`${t('branding.maxSize')}: ${maxSizeKB}KB`);
        return;
      }

      // Convert to base64 for preview (in real app, upload to storage)
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    [maxSizeKB, onChange, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {value ? (
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'relative rounded-lg border bg-muted/50 overflow-hidden',
              sizeClasses[previewSize]
            )}
          >
            <img
              src={value}
              alt={label}
              className="h-full w-full object-contain"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
          >
            <X className="me-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            )}
          >
            <input
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <div className="flex flex-col items-center gap-2 text-center">
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground">
                {t('branding.dropzone')}
              </p>
              {hint && (
                <p className="text-xs text-muted-foreground">{hint}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {t('branding.maxSize')}: {maxSizeKB}KB
              </p>
            </div>
          </div>

          {/* URL Input Toggle */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
            >
              {showUrlInput ? t('common.cancel') : t('branding.orEnterUrl')}
            </Button>
          </div>

          {showUrlInput && (
            <div className="flex items-center gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={handleUrlSubmit}>
                {t('common.confirm')}
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
