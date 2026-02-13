import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Download, FileJson, FileText, Info } from 'lucide-react';
import { AIModel } from '@/hooks/useAIModels';

interface TopControlBarProps {
  accuracyMode: string;
  onAccuracyModeChange: (mode: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  models: AIModel[];
  onSave: () => void;
  onExport: (format: 'json' | 'pdf') => void;
  canSave: boolean;
  canExport: boolean;
  isSaving: boolean;
}

const tierColors: Record<string, string> = {
  standard: 'bg-muted text-muted-foreground',
  high: 'bg-primary/10 text-primary',
  premium: 'bg-chart-4/20 text-chart-4',
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
};

export function TopControlBar({
  accuracyMode,
  onAccuracyModeChange,
  selectedModel,
  onModelChange,
  models,
  onSave,
  onExport,
  canSave,
  canExport,
  isSaving,
}: TopControlBarProps) {
  const { t } = useTranslation();

  const selectedModelData = models.find(m => m.model_key === selectedModel);

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card flex-wrap">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium whitespace-nowrap">{t('aiGenerator.accuracyMode')}</label>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{t('aiGenerator.accuracyModeTooltip')}</p>
            </TooltipContent>
          </Tooltip>
          <Select value={accuracyMode} onValueChange={onAccuracyModeChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">{t('aiGenerator.modeStandard')}</SelectItem>
              <SelectItem value="high">{t('aiGenerator.modeHigh')}</SelectItem>
              <SelectItem value="strict">{t('aiGenerator.modeStrict')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">{t('aiGenerator.aiModel')}</label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map(model => (
                <SelectItem key={model.model_key} value={model.model_key}>
                  <div className="flex items-center gap-2">
                    <span>{model.display_name}</span>
                    <Badge variant="outline" className={`text-[10px] px-1 py-0 ${tierColors[model.accuracy_tier] || ''}`}>
                      {model.accuracy_tier}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedModelData && (
            <Badge variant="outline" className={`text-xs ${tierColors[selectedModelData.cost_tier] || ''}`}>
              {selectedModelData.cost_tier} cost
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave} disabled={!canSave || isSaving}>
          <Save className="h-4 w-4 me-1" />
          {isSaving ? t('common.loading') : t('aiGenerator.saveDraft')}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!canExport}>
              <Download className="h-4 w-4 me-1" />
              {t('aiGenerator.export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExport('json')}>
              <FileJson className="h-4 w-4 me-2" />
              JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('pdf')}>
              <FileText className="h-4 w-4 me-2" />
              {t('aiGenerator.printPdf')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
