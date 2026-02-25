import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSecureAttachments } from '@/hooks/crisis/useSecureAttachments';
import { toast } from 'sonner';
import { Upload, FileText, Image, Music, Shield, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  caseId: string;
  tenantId: string;
  expiryDays?: number;
}

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'audio/webm', 'audio/mpeg', 'audio/ogg',
];
const MAX_SIZE = 10 * 1024 * 1024;

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SecureAttachmentUploader({ caseId, tenantId, expiryDays = 30 }: Props) {
  const { t } = useTranslation();
  const { attachments, uploadAttachment } = useSecureAttachments(caseId);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('crisisSupport.attachments.invalidType'));
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(t('crisisSupport.attachments.tooLarge'));
      return;
    }

    setUploading(true);
    setProgress(30);

    try {
      await uploadAttachment.mutateAsync({ file, caseId, tenantId, expiryDays });
      setProgress(100);
      toast.success(t('crisisSupport.attachments.uploaded'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
          onChange={e => handleFiles(e.target.files)}
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{t('crisisSupport.attachments.dropzone')}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{t('crisisSupport.attachments.maxSize')}</p>

        {uploading && (
          <div className="mt-3">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Encryption badge */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Shield className="h-3 w-3 text-primary" />
        {t('crisisSupport.attachments.encrypted')}
        <span className="mx-1">•</span>
        <Clock className="h-3 w-3" />
        {t('crisisSupport.attachments.autoDelete', { days: expiryDays })}
      </div>

      {/* Uploaded list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(att => (
            <Card key={att.id} className="rounded-lg">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getFileIcon(att.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.filename}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(att.size_bytes)} • {t('crisisSupport.attachments.expiresIn', {
                      time: formatDistanceToNow(new Date(att.expires_at)),
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  <Shield className="h-2.5 w-2.5 me-1" />
                  {t('crisisSupport.attachments.secure')}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
