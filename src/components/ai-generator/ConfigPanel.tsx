import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, ChevronDown, Settings2, ChevronsUpDown, ClipboardList, Heart } from 'lucide-react';
import { AdvancedSettings } from '@/hooks/useEnhancedAIGeneration';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { FrameworkSelector } from './FrameworkSelector';
import { KnowledgeDocument } from '@/hooks/useAIKnowledge';
import { ReferenceFramework } from '@/hooks/useReferenceFrameworks';
import { useQuestionCategories } from '@/hooks/useQuestionCategories';
import { useQuestionSubcategories } from '@/hooks/useQuestionSubcategories';
import { useState } from 'react';

export type QuestionPurpose = 'survey' | 'wellness';

interface ConfigPanelProps {
  purpose: QuestionPurpose;
  onPurposeChange: (purpose: QuestionPurpose) => void;
  questionTypes: string[];
  onQuestionTypesChange: (types: string[]) => void;
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
  // Reference frameworks
  referenceFrameworks: ReferenceFramework[];
  selectedFrameworkIds: string[];
  onSelectedFrameworkIdsChange: (ids: string[]) => void;
  onAddFramework: (data: any) => void;
  onUpdateFramework: (data: any) => void;
  onDeleteFramework: (id: string) => void;
  frameworksLoading: boolean;
  currentUserId?: string;
  // Multi-select categories & subcategories
  selectedCategoryIds: string[];
  onSelectedCategoryIdsChange: (ids: string[]) => void;
  selectedSubcategoryIds: string[];
  onSelectedSubcategoryIdsChange: (ids: string[]) => void;
}

export function ConfigPanel({
  purpose,
  onPurposeChange,
  questionTypes,
  onQuestionTypesChange,
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
  referenceFrameworks,
  selectedFrameworkIds,
  onSelectedFrameworkIdsChange,
  onAddFramework,
  onUpdateFramework,
  onDeleteFramework,
  frameworksLoading,
  currentUserId,
  selectedCategoryIds,
  onSelectedCategoryIdsChange,
  selectedSubcategoryIds,
  onSelectedSubcategoryIdsChange,
}: ConfigPanelProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const { categories = [] } = useQuestionCategories();
  const { subcategories: allSubcategories = [] } = useQuestionSubcategories();
  const activeCategories = (categories || []).filter(c => c.is_active);

  // Filter subcategories by selected categories
  const filteredSubcategories = allSubcategories.filter(
    s => s.is_active && selectedCategoryIds.includes(s.category_id)
  );

  // Search filtering
  const searchedCategories = activeCategories.filter(c => {
    if (!categorySearch) return true;
    const search = categorySearch.toLowerCase();
    return c.name.toLowerCase().includes(search) || (c.name_ar && c.name_ar.toLowerCase().includes(search));
  });

  const searchedSubcategories = filteredSubcategories.filter(s => {
    if (!subcategorySearch) return true;
    const search = subcategorySearch.toLowerCase();
    return s.name.toLowerCase().includes(search) || (s.name_ar && s.name_ar.toLowerCase().includes(search));
  });

  const toggleCategory = (categoryId: string) => {
    const isSelected = selectedCategoryIds.includes(categoryId);
    let nextIds: string[];
    if (isSelected) {
      nextIds = selectedCategoryIds.filter(id => id !== categoryId);
      // Remove orphaned subcategory selections
      const orphanedSubIds = allSubcategories
        .filter(s => s.category_id === categoryId)
        .map(s => s.id);
      if (orphanedSubIds.length > 0) {
        onSelectedSubcategoryIdsChange(
          selectedSubcategoryIds.filter(sid => !orphanedSubIds.includes(sid))
        );
      }
    } else {
      nextIds = [...selectedCategoryIds, categoryId];
    }
    onSelectedCategoryIdsChange(nextIds);
  };

  const toggleSubcategory = (subcategoryId: string) => {
    if (selectedSubcategoryIds.includes(subcategoryId)) {
      onSelectedSubcategoryIdsChange(selectedSubcategoryIds.filter(id => id !== subcategoryId));
    } else {
      onSelectedSubcategoryIdsChange([...selectedSubcategoryIds, subcategoryId]);
    }
  };

  const updateAdvanced = (key: keyof AdvancedSettings, value: any) => {
    onAdvancedSettingsChange({ ...advancedSettings, [key]: value });
  };

  const getCategoryLabel = (c: any) => isRTL && c.name_ar ? c.name_ar : c.name;
  const getSubcategoryLabel = (s: any) => isRTL && s.name_ar ? s.name_ar : s.name;

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
          {/* Purpose Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('aiGenerator.purpose')}</Label>
            <p className="text-xs text-muted-foreground">{t('aiGenerator.purposeDescription')}</p>
            <ToggleGroup
              type="single"
              value={purpose}
              onValueChange={(v) => { if (v) onPurposeChange(v as QuestionPurpose); }}
              className="grid grid-cols-2 gap-2"
              variant="outline"
            >
              <ToggleGroupItem
                value="survey"
                className="flex flex-col items-center gap-1 py-3 px-2 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
              >
                <ClipboardList className="h-5 w-5" />
                <span className="text-xs font-medium">{t('aiGenerator.purposeSurvey')}</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="wellness"
                className="flex flex-col items-center gap-1 py-3 px-2 data-[state=on]:bg-primary/10 data-[state=on]:border-primary"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs font-medium">{t('aiGenerator.purposeWellness')}</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Category & Subcategory Multi-Select */}
          <div className="grid grid-cols-2 gap-4">
            {/* Categories Multi-Select */}
            <div className="space-y-2">
              <Label>{t('aiGenerator.category')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">
                      {selectedCategoryIds.length === 0
                        ? t('aiGenerator.selectCategories')
                        : t('aiGenerator.categoriesSelected', { count: selectedCategoryIds.length })}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <div className="p-2">
                    <Input
                      placeholder={t('aiGenerator.searchCategories')}
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <ScrollArea className="h-[200px] px-2 pb-2">
                    {searchedCategories.map(c => (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedCategoryIds.includes(c.id)}
                          onCheckedChange={() => toggleCategory(c.id)}
                        />
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: c.color || '#3B82F6' }}
                        />
                        <span className="truncate">{getCategoryLabel(c)}</span>
                      </label>
                    ))}
                    {searchedCategories.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">{t('common.noData')}</p>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            {/* Subcategories Multi-Select */}
            <div className="space-y-2">
              <Label>{t('aiGenerator.subcategory')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                    disabled={selectedCategoryIds.length === 0}
                  >
                    <span className="truncate">
                      {selectedCategoryIds.length === 0
                        ? t('aiGenerator.selectSubcategories')
                        : selectedSubcategoryIds.length === 0
                          ? t('aiGenerator.selectSubcategories')
                          : t('aiGenerator.categoriesSelected', { count: selectedSubcategoryIds.length })}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <div className="p-2">
                    <Input
                      placeholder={t('aiGenerator.searchSubcategories')}
                      value={subcategorySearch}
                      onChange={e => setSubcategorySearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <ScrollArea className="h-[200px] px-2 pb-2">
                    {searchedSubcategories.map(s => {
                      const parentCat = activeCategories.find(c => c.id === s.category_id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={selectedSubcategoryIds.includes(s.id)}
                            onCheckedChange={() => toggleSubcategory(s.id)}
                          />
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color || '#6366F1' }}
                          />
                          <span className="truncate">
                            {getSubcategoryLabel(s)}
                            {parentCat && (
                              <span className="text-muted-foreground text-xs ms-1">
                                ({getCategoryLabel(parentCat)})
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                    {searchedSubcategories.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">{t('common.noData')}</p>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Question Type Multi-Select */}
          <div className="space-y-2">
            <Label>{t('aiGenerator.questionType')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  <span className="truncate">
                    {questionTypes.length === 0
                      ? t('aiGenerator.typeMixed')
                      : t('aiGenerator.typesSelected', { count: questionTypes.length })}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0" align="start">
                <ScrollArea className="max-h-[240px] px-2 py-2">
                  {(purpose === 'wellness'
                    ? [
                        { value: 'likert_5', label: t('aiGenerator.typeScale') },
                        { value: 'multiple_choice', label: t('aiGenerator.typeMCQ') },
                        { value: 'open_ended', label: t('aiGenerator.typeOpen') },
                      ]
                    : [
                        { value: 'likert_5', label: t('aiGenerator.typeLikert') },
                        { value: 'multiple_choice', label: t('aiGenerator.typeMCQ') },
                        { value: 'open_ended', label: t('aiGenerator.typeOpen') },
                        { value: 'numeric_scale', label: t('aiGenerator.typeNumeric') },
                        { value: 'yes_no', label: t('aiGenerator.typeYesNo') },
                      ]
                  ).map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                    >
                      <Checkbox
                        checked={questionTypes.includes(opt.value)}
                        onCheckedChange={() => {
                          if (questionTypes.includes(opt.value)) {
                            onQuestionTypesChange(questionTypes.filter(v => v !== opt.value));
                          } else {
                            onQuestionTypesChange([...questionTypes, opt.value]);
                          }
                        }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">{t('aiGenerator.typeMultiSelectHint')}</p>
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
          <Button onClick={onGenerate} disabled={isGenerating || selectedCategoryIds.length === 0} className="w-full" size="lg">
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
