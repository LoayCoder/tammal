import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { useFrameworkDocuments } from '@/hooks/questions/useFrameworkDocuments';

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
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t('aiGenerator.frameworkDocuments')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
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
        <p className="text-xs text-muted-foreground">{t('common.loading')}</p>
      ) : documents.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{t('aiGenerator.noFrameworkDocs')}</p>
      ) : (
        <div className="space-y-1.5">
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center gap-2 p-1.5 rounded-md bg-background/50 border border-border/30 text-xs">
              <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="flex-1 truncate">{doc.file_name}</span>
              {doc.extracted_text ? (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-green-500/10 text-green-600 border-green-500/30 shadow-[0_0_4px_hsl(142_71%_45%/0.2)]">
                  {t('aiGenerator.extracted')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-amber-500/30 animate-pulse">
                  {t('aiGenerator.pending')}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteDocument(doc.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
