import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { useFrameworkDocuments } from '@/hooks/useFrameworkDocuments';

interface FrameworkDocumentsProps {
  frameworkId: string;
}

export function FrameworkDocuments({ frameworkId }: FrameworkDocumentsProps) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const { documents, isLoading, uploadDocument, deleteDocument, isUploading } = useFrameworkDocuments(frameworkId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      return;
    }
    uploadDocument({ frameworkId, file });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          {t('aiGenerator.frameworkDocuments')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 text-[10px] px-1.5"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin me-1" />
          ) : (
            <Upload className="h-3 w-3 me-1" />
          )}
          {t('aiGenerator.uploadDoc')}
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.txt,.md"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <p className="text-[10px] text-muted-foreground">{t('common.loading')}</p>
      ) : documents.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">{t('aiGenerator.noFrameworkDocs')}</p>
      ) : (
        <div className="space-y-1">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-1.5 p-1 rounded bg-background/50 border border-border/30 text-[10px]">
              <FileText className="h-3 w-3 text-primary shrink-0" />
              <span className="flex-1 truncate">{doc.file_name}</span>
              {doc.extracted_text ? (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3 bg-green-500/10 text-green-600 border-green-500/20">
                  {t('aiGenerator.extracted')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3">
                  {t('aiGenerator.pending')}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                onClick={() => deleteDocument(doc.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
