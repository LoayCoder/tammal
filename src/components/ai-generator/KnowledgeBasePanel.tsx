import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BookOpen, Upload, ChevronDown, Trash2, FileText, Loader2 } from 'lucide-react';
import { KnowledgeDocument } from '@/hooks/useAIKnowledge';

const frameworks = [
  { key: 'frameworkISO45003', color: 'default' as const },
  { key: 'frameworkISO10018', color: 'secondary' as const },
  { key: 'frameworkCOPSOQ', color: 'outline' as const },
  { key: 'frameworkUWES', color: 'default' as const },
  { key: 'frameworkWHO', color: 'secondary' as const },
  { key: 'frameworkGallup', color: 'outline' as const },
];

interface KnowledgeBasePanelProps {
  useExpertKnowledge: boolean;
  onUseExpertKnowledgeChange: (value: boolean) => void;
  documents: KnowledgeDocument[];
  onUpload: (file: File) => void;
  onToggleDocument: (params: { id: string; isActive: boolean }) => void;
  onDeleteDocument: (id: string) => void;
  isUploading: boolean;
}

export function KnowledgeBasePanel({
  useExpertKnowledge,
  onUseExpertKnowledgeChange,
  documents,
  onUpload,
  onToggleDocument,
  onDeleteDocument,
  isUploading,
}: KnowledgeBasePanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [frameworksOpen, setFrameworksOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return;
    }

    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return;
    }

    if (documents.length >= 5) {
      return;
    }

    onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BookOpen className="h-4 w-4 text-primary" />
          {t('aiGenerator.knowledgeBase')}
        </CardTitle>
        <CardDescription className="text-xs">{t('aiGenerator.knowledgeBaseDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expert Knowledge Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm">{t('aiGenerator.useExpertPrompt')}</Label>
            <p className="text-xs text-muted-foreground">{t('aiGenerator.expertPromptDesc')}</p>
          </div>
          <Switch checked={useExpertKnowledge} onCheckedChange={onUseExpertKnowledgeChange} />
        </div>

        {/* Frameworks List */}
        {useExpertKnowledge && (
          <Collapsible open={frameworksOpen} onOpenChange={setFrameworksOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                {t('aiGenerator.frameworks')}
                <ChevronDown className={`h-3 w-3 transition-transform ${frameworksOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 pt-1">
              {frameworks.map(fw => (
                <Badge key={fw.key} variant={fw.color} className="text-xs block w-full text-start py-1">
                  {t(`aiGenerator.${fw.key}`)}
                </Badge>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Document Upload */}
        <div className="space-y-2">
          <Label className="text-sm">{t('aiGenerator.uploadDocuments')}</Label>
          <p className="text-xs text-muted-foreground">{t('aiGenerator.uploadDocumentsDesc')}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || documents.length >= 5}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {t('aiGenerator.parsing')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 me-2" />
                {t('aiGenerator.dragOrClick')}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground text-center">{t('aiGenerator.maxFileSize')}</p>
        </div>

        {/* Document List */}
        {documents.length > 0 && (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between gap-2 p-2 rounded-md border text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(doc.file_size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Switch
                    checked={doc.is_active}
                    onCheckedChange={(checked) => onToggleDocument({ id: doc.id, isActive: checked })}
                    className="scale-75"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
