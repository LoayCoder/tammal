import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sparkles, Loader2, ChevronDown, Settings2 } from 'lucide-react';
import { AdvancedSettings } from '@/hooks/useEnhancedAIGeneration';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { FocusAreaManager } from './FocusAreaManager';
import { FrameworkSelector } from './FrameworkSelector';
import { KnowledgeDocument } from '@/hooks/useAIKnowledge';
import { FocusArea } from '@/hooks/useFocusAreas';
import { ReferenceFramework } from '@/hooks/useReferenceFrameworks';
import { useQuestionCategories } from '@/hooks/useQuestionCategories';
import { useQuestionSubcategories } from '@/hooks/useQuestionSubcategories';
import { useState } from 'react';

interface ConfigPanelProps {
  focusAreas: string[];
  onFocusAreasChange: (areas: string[]) => void;
  questionType: string;
  onQuestionTypeChange: (type: string) => void;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  complexity: string;
  onComplexityChange: (complexity: string) => void;
  tone: string;
  onToneChange: (tone: string) => void;
  advancedSettings: AdvancedSettings;
  onAdvancedSettingsChange: (settings: AdvancedSettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  // Knowledge base props
  documents: KnowledgeDocument[];
  onUploadDocument: (file: File) => void;
  onToggleDocument: (params: { id: string; isActive: boolean }) => void;
  onDeleteDocument: (id: string) => void;
  isUploading: boolean;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  onRewritePrompt: () => void;
  isRewriting: boolean;
  // Dynamic focus areas
  focusAreaList: FocusArea[];
  focusAreasLoading: boolean;
  onAddFocusArea: (params: { labelKey: string; labelAr?: string }) => void;
  onUpdateFocusArea: (params: { id: string; labelKey: string; labelAr?: string }) => void;
  onDeleteFocusArea: (id: string) => void;
  // Reference frameworks
  referenceFrameworks: ReferenceFramework[];
  selectedFrameworkIds: string[];
  onSelectedFrameworkIdsChange: (ids: string[]) => void;
  onAddFramework: (data: any) => void;
  onUpdateFramework: (data: any) => void;
  onDeleteFramework: (id: string) => void;
  frameworksLoading: boolean;
  currentUserId?: string;
  selectedCategoryId: string;
  onSelectedCategoryIdChange: (id: string) => void;
  selectedSubcategoryId: string;
  onSelectedSubcategoryIdChange: (id: string) => void;
}

export function ConfigPanel({
  focusAreas,
  onFocusAreasChange,
  questionType,
  onQuestionTypeChange,
  questionCount,
  onQuestionCountChange,
  complexity,
  onComplexityChange,
  tone,
  onToneChange,
  advancedSettings,
  onAdvancedSettingsChange,
  onGenerate,
  isGenerating,
  documents,
  onUploadDocument,
  onToggleDocument,
  onDeleteDocument,
  isUploading,
  customPrompt,
  onCustomPromptChange,
  onRewritePrompt,
  isRewriting,
  focusAreaList,
  focusAreasLoading,
  onAddFocusArea,
  onUpdateFocusArea,
  onDeleteFocusArea,
  referenceFrameworks,
  selectedFrameworkIds,
  onSelectedFrameworkIdsChange,
  onAddFramework,
  onUpdateFramework,
  onDeleteFramework,
  frameworksLoading,
  currentUserId,
  selectedCategoryId,
  onSelectedCategoryIdChange,
  selectedSubcategoryId,
  onSelectedSubcategoryIdChange,
}: ConfigPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { categories } = useQuestionCategories();
  const { subcategories } = useQuestionSubcategories(selectedCategoryId || undefined);
  const activeCategories = categories.filter(c => c.is_active);
  const activeSubcategories = subcategories.filter(s => s.is_active);

  const toggleFocusArea = (value: string) => {
    onFocusAreasChange(
      focusAreas.includes(value)
        ? focusAreas.filter(v => v !== value)
        : [...focusAreas, value]
    );
  };

  const updateAdvanced = (key: keyof AdvancedSettings, value: any) => {
    onAdvancedSettingsChange({ ...advancedSettings, [key]: value });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('aiGenerator.configTitle')}
          </CardTitle>
          <CardDescription>{t('aiGenerator.configDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Focus Areas */}
          <FocusAreaManager
            focusAreas={focusAreaList}
            selectedAreas={focusAreas}
            onToggleArea={toggleFocusArea}
            onAdd={onAddFocusArea}
            onUpdate={onUpdateFocusArea}
            onDelete={onDeleteFocusArea}
            isLoading={focusAreasLoading}
          />

          {/* Category & Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('aiGenerator.category')}</Label>
              <Select value={selectedCategoryId || '__all__'} onValueChange={(v) => { onSelectedCategoryIdChange(v === '__all__' ? '' : v); onSelectedSubcategoryIdChange(''); }}>
                <SelectTrigger><SelectValue placeholder={t('aiGenerator.selectCategory')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('common.all')}</SelectItem>
                  {activeCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{isRTL && c.name_ar ? c.name_ar : c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('aiGenerator.subcategory')}</Label>
              <Select value={selectedSubcategoryId || '__all__'} onValueChange={(v) => onSelectedSubcategoryIdChange(v === '__all__' ? '' : v)} disabled={!selectedCategoryId}>
                <SelectTrigger><SelectValue placeholder={t('aiGenerator.selectSubcategory')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{t('common.all')}</SelectItem>
                  {activeSubcategories.map(s => (
                    <SelectItem key={s.id} value={s.id}>{isRTL && s.name_ar ? s.name_ar : s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question Type */}
          <div className="space-y-2">
            <Label>{t('aiGenerator.questionType')}</Label>
            <Select value={questionType} onValueChange={onQuestionTypeChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">{t('aiGenerator.typeMixed')}</SelectItem>
                <SelectItem value="likert_5">{t('aiGenerator.typeLikert')}</SelectItem>
                <SelectItem value="multiple_choice">{t('aiGenerator.typeMCQ')}</SelectItem>
                <SelectItem value="open_ended">{t('aiGenerator.typeOpen')}</SelectItem>
                <SelectItem value="scenario_based">{t('aiGenerator.typeScenario')}</SelectItem>
                <SelectItem value="numeric_scale">{t('aiGenerator.typeNumeric')}</SelectItem>
                <SelectItem value="yes_no">{t('aiGenerator.typeYesNo')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('aiGenerator.questionCount')}</Label>
              <Select value={String(questionCount)} onValueChange={v => onQuestionCountChange(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('aiGenerator.complexity')}</Label>
              <Select value={complexity} onValueChange={onComplexityChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">{t('aiGenerator.simple')}</SelectItem>
                  <SelectItem value="moderate">{t('aiGenerator.moderate')}</SelectItem>
                  <SelectItem value="advanced">{t('aiGenerator.advanced')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('aiGenerator.tone')}</Label>
            <Select value={tone} onValueChange={onToneChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">{t('aiGenerator.neutral')}</SelectItem>
                <SelectItem value="formal">{t('aiGenerator.formal')}</SelectItem>
                <SelectItem value="analytical">{t('aiGenerator.toneAnalytical')}</SelectItem>
                <SelectItem value="supportive">{t('aiGenerator.toneSupportive')}</SelectItem>
                <SelectItem value="direct">{t('aiGenerator.toneDirect')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between" size="sm">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  {t('aiGenerator.advancedSettings')}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.requireExplanation')}</Label>
                <Switch checked={advancedSettings.requireExplanation} onCheckedChange={v => updateAdvanced('requireExplanation', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.biasDetection')}</Label>
                <Switch checked={advancedSettings.enableBiasDetection} onCheckedChange={v => updateAdvanced('enableBiasDetection', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.ambiguityDetection')}</Label>
                <Switch checked={advancedSettings.enableAmbiguityDetection} onCheckedChange={v => updateAdvanced('enableAmbiguityDetection', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.duplicateDetection')}</Label>
                <Switch checked={advancedSettings.enableDuplicateDetection} onCheckedChange={v => updateAdvanced('enableDuplicateDetection', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.criticPass')}</Label>
                <Switch checked={advancedSettings.enableCriticPass} onCheckedChange={v => updateAdvanced('enableCriticPass', v)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">{t('aiGenerator.minWordLength')}</Label>
                <Input
                  type="number" min={1} max={50}
                  value={advancedSettings.minWordLength}
                  onChange={e => updateAdvanced('minWordLength', parseInt(e.target.value) || 5)}
                  className="w-24"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Generate Button */}
          <Button onClick={onGenerate} disabled={isGenerating || focusAreas.length === 0} className="w-full" size="lg">
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin me-2" />
                {t('aiGenerator.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 me-2" />
                {t('aiGenerator.generate')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reference Frameworks (separate card) */}
      <FrameworkSelector
        frameworks={referenceFrameworks}
        selectedFrameworkIds={selectedFrameworkIds}
        onSelectedChange={onSelectedFrameworkIdsChange}
        onAdd={onAddFramework}
        onUpdate={onUpdateFramework}
        onDelete={onDeleteFramework}
        isLoading={frameworksLoading}
        currentUserId={currentUserId}
      />

      {/* Knowledge Base (custom prompt + documents) */}
      <KnowledgeBasePanel
        documents={documents}
        onUpload={onUploadDocument}
        onToggleDocument={onToggleDocument}
        onDeleteDocument={onDeleteDocument}
        isUploading={isUploading}
        customPrompt={customPrompt}
        onCustomPromptChange={onCustomPromptChange}
        onRewritePrompt={onRewritePrompt}
        isRewriting={isRewriting}
      />
    </div>
  );
}
