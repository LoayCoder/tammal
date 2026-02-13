import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BookOpen, Upload, ChevronDown, Trash2, FileText, Loader2,
  Wand2, ShieldCheck, Brain, Info, Check,
} from 'lucide-react';
import { KnowledgeDocument } from '@/hooks/useAIKnowledge';

const FRAMEWORK_ID_MAP: Record<string, string> = {
  frameworkISO45003: 'ISO45003',
  frameworkISO10018: 'ISO10018',
  frameworkCOPSOQ: 'COPSOQ',
  frameworkUWES: 'UWES',
  frameworkWHO: 'WHO',
  frameworkGallup: 'Gallup',
};

const frameworks = [
  { key: 'frameworkISO45003', icon: '🛡️' },
  { key: 'frameworkISO10018', icon: '📊' },
  { key: 'frameworkCOPSOQ', icon: '🧠' },
  { key: 'frameworkUWES', icon: '⚡' },
  { key: 'frameworkWHO', icon: '🏥' },
  { key: 'frameworkGallup', icon: '📈' },
];

interface KnowledgeBasePanelProps {
  useExpertKnowledge: boolean;
  onUseExpertKnowledgeChange: (value: boolean) => void;
  documents: KnowledgeDocument[];
  onUpload: (file: File) => void;
  onToggleDocument: (params: { id: string; isActive: boolean }) => void;
  onDeleteDocument: (id: string) => void;
  isUploading: boolean;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  onRewritePrompt: () => void;
  isRewriting: boolean;
  selectedFrameworks: string[];
  onSelectedFrameworksChange: (frameworks: string[]) => void;
}

export function KnowledgeBasePanel({
  useExpertKnowledge,
  onUseExpertKnowledgeChange,
  documents,
  onUpload,
  onToggleDocument,
  onDeleteDocument,
  isUploading,
  customPrompt,
  onCustomPromptChange,
  onRewritePrompt,
  isRewriting,
  selectedFrameworks,
  onSelectedFrameworksChange,
}: KnowledgeBasePanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [frameworksOpen, setFrameworksOpen] = useState(true);
  const [docsOpen, setDocsOpen] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) return;
    onUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 100 * 1024; // 100KB
    if (file.size > maxSize) {
      toast.error(t('aiGenerator.fileTooLarge'));
      return false;
    }
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      toast.error(t('aiGenerator.fileTypeNotAllowed'));
      return false;
    }
    if (documents.length >= 5) {
      toast.error(t('aiGenerator.maxDocsReached'));
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!validateFile(file)) return;
    onUpload(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const toggleFramework = (frameworkKey: string) => {
    const id = FRAMEWORK_ID_MAP[frameworkKey];
    if (selectedFrameworks.includes(id)) {
      onSelectedFrameworksChange(selectedFrameworks.filter(f => f !== id));
    } else {
      onSelectedFrameworksChange([...selectedFrameworks, id]);
    }
  };

  const isFrameworkSelected = (frameworkKey: string) => {
    return selectedFrameworks.includes(FRAMEWORK_ID_MAP[frameworkKey]);
  };

  const activeDocCount = documents.filter(d => d.is_active).length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-5 w-5 text-primary" />
            {t('aiGenerator.knowledgeBase')}
          </CardTitle>
          {activeDocCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeDocCount} {t('aiGenerator.docsActive')}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{t('aiGenerator.knowledgeBaseDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Expert Knowledge Toggle */}
        <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50 border">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">{t('aiGenerator.useExpertPrompt')}</Label>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t('aiGenerator.expertPromptDesc')}</p>
          </div>
          <Switch checked={useExpertKnowledge} onCheckedChange={onUseExpertKnowledgeChange} />
        </div>

        {/* Frameworks List - Selectable */}
        {useExpertKnowledge && (
          <Collapsible open={frameworksOpen} onOpenChange={setFrameworksOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  {t('aiGenerator.frameworks')}
                  {selectedFrameworks.length > 0 && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 ms-1">
                      {t('aiGenerator.frameworksSelected', { count: selectedFrameworks.length })}
                    </Badge>
                  )}
                </span>
                <ChevronDown className={`h-3 w-3 transition-transform ${frameworksOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <p className="text-[10px] text-muted-foreground mb-2">{t('aiGenerator.selectFrameworks')}</p>
              <div className="grid gap-1.5">
                {frameworks.map(fw => {
                  const selected = isFrameworkSelected(fw.key);
                  return (
                    <button
                      key={fw.key}
                      type="button"
                      onClick={() => toggleFramework(fw.key)}
                      className={`flex items-center gap-2 p-2 rounded-md text-xs text-start transition-all cursor-pointer border ${
                        selected
                          ? 'bg-primary/10 border-primary/30 border-s-2 border-s-primary'
                          : 'bg-muted/30 border-transparent hover:bg-muted/50'
                      }`}
                    >
                      <Checkbox
                        checked={selected}
                        className="pointer-events-none h-3.5 w-3.5"
                        tabIndex={-1}
                      />
                      <span>{fw.icon}</span>
                      <span className="text-foreground flex-1">{t(`aiGenerator.${fw.key}`)}</span>
                      {selected && <Check className="h-3 w-3 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Custom Prompt Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1.5">
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              {t('aiGenerator.customPrompt')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{t('aiGenerator.customPromptTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            placeholder={t('aiGenerator.customPromptPlaceholder')}
            value={customPrompt}
            onChange={e => onCustomPromptChange(e.target.value)}
            className="min-h-[80px] text-xs resize-y"
          />
          {customPrompt.trim().length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onRewritePrompt}
              disabled={isRewriting || customPrompt.trim().length < 10}
            >
              {isRewriting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                  {t('aiGenerator.rewriting')}
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5 me-1.5" />
                  {t('aiGenerator.rewriteAsExpert')}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Document Upload Section */}
        <Collapsible open={docsOpen} onOpenChange={setDocsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs h-8">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {t('aiGenerator.uploadDocuments')} {documents.length > 0 && `(${documents.length})`}
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform ${docsOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            <p className="text-xs text-muted-foreground">{t('aiGenerator.uploadDocumentsDesc')}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Drop zone */}
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-1.5">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">{t('aiGenerator.parsing')}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="h-6 w-6 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">{t('aiGenerator.dragOrClick')}</span>
                  <span className="text-[10px] text-muted-foreground/60">{t('aiGenerator.maxFileSize')}</span>
                </div>
              )}
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div className="space-y-1.5">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-md border text-sm transition-colors ${
                      doc.is_active ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`h-4 w-4 shrink-0 ${doc.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">{doc.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatSize(doc.file_size)}
                          {doc.is_active
                            ? ` • ${t('aiGenerator.documentActive')}`
                            : ` • ${t('aiGenerator.documentInactive')}`}
                        </p>
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
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
