import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeKB?: number;
  previewSize?: 'small' | 'medium' | 'large';
}

export function ImageUploader({ 
  label, 
  value, 
  onChange, 
  accept = 'image/png,image/jpeg,image/svg+xml',
  maxSizeKB = 2048,
  previewSize = 'medium'
}: ImageUploaderProps) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    small: 'h-16 w-16',
    medium: 'h-24 w-24',
    large: 'h-32 w-32'
  };

  const handleFile = useCallback((file: File) => {
    setError(null);
    
    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      setError(`${t('branding.maxSize')}: ${maxSizeKB}KB`);
      return;
    }

    // Validate file type
    const acceptedTypes = accept.split(',').map(t => t.trim());
    if (!acceptedTypes.includes(file.type)) {
      setError(t('branding.invalidFormat'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    onChange(file);
  }, [accept, maxSizeKB, onChange, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setPreview(null);
    setError(null);
    onChange(null);
  }, [onChange]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-6 transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-border",
            "hover:border-primary/50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="flex flex-col items-center gap-3">
            {preview ? (
              <div className="relative">
                <img 
                  src={preview} 
                  alt={label}
                  className={cn(
                    "object-contain rounded-md border border-border",
                    sizeClasses[previewSize]
                  )}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -end-2 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className={cn(
                "flex items-center justify-center rounded-md bg-muted",
                sizeClasses[previewSize]
              )}>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="text-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span>{t('branding.dropzone')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('branding.maxSize')}: {maxSizeKB}KB
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
