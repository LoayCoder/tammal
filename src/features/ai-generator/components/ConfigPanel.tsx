import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, ChevronDown, Settings2, ChevronsUpDown, Lock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { differenceInDays, parseISO } from 'date-fns';
import { AdvancedSettings } from '@/hooks/questions/useEnhancedAIGeneration';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { FrameworkSelector } from './FrameworkSelector';
import { CreatePeriodDialog } from './CreatePeriodDialog';
import { DistributionPreview } from './DistributionPreview';
import { useQuestionCategories } from '@/hooks/questions/useQuestionCategories';
import { useQuestionSubcategories } from '@/hooks/questions/useQuestionSubcategories';
import { useConfigPanelState } from './useConfigPanelState';
import { PurposeSelector } from './PurposeSelector';
import { GenerationPeriodSelector } from './GenerationPeriodSelector';
import { CategorySubcategorySelect } from './CategorySubcategorySelect';
import { QuestionCountComplexity } from './QuestionCountComplexity';
import { useGeneratorContext } from '@/features/ai-generator';
import type { QuestionPurpose } from './useConfigPanelState';
export type { QuestionPurpose };

export function ConfigPanel() {
  const g = useGeneratorContext();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const {
    advancedOpen,
    createPeriodOpen,
    categorySearch,
    subcategorySearch,
    setAdvancedOpen,
    setCreatePeriodOpen,
    setCategorySearch,
    setSubcategorySearch,
  } = useConfigPanelState();

  const { categories = [] } = useQuestionCategories();
  const { subcategories: allSubcategories = [] } = useQuestionSubcategories();
  const activeCategories = (categories || []).filter(c => c.is_active);

  // When a period is selected, lock to its categories/subcategories
  const selectedPeriod = g.periods.find(p => p.id === g.selectedPeriodId) || null;
  const isPeriodLocked = !!selectedPeriod;
  const isGenerationLocked = !!g.activePeriodForPurpose && g.activePeriodForPurpose.id !== g.selectedPeriodId;

  // Filter subcategories by selected categories
  const effectiveCategoryIds = isPeriodLocked ? (selectedPeriod.locked_category_ids || []) as string[] : g.selectedCategoryIds;
  const effectiveSubcategoryIds = isPeriodLocked ? (selectedPeriod.locked_subcategory_ids || []) as string[] : g.selectedSubcategoryIds;
  const filteredSubcategories = allSubcategories.filter(
    s => s.is_active && effectiveCategoryIds.includes(s.category_id)
  );
  const selectedSubsForPreview = filteredSubcategories.filter(s => effectiveSubcategoryIds.includes(s.id));

  // Prerequisites check
  const prerequisitesMet = activeCategories.length >= 3;
  const hasCategorySelected = effectiveCategoryIds.length > 0;

  // Auto question count from period
  const periodDays = selectedPeriod
    ? Math.max(1, differenceInDays(parseISO(selectedPeriod.end_date), parseISO(selectedPeriod.start_date)))
    : 0;
  const autoQuestionCount = selectedPeriod ? periodDays * g.questionsPerDay : 0;

  // Sync auto-calculated count to parent when period is selected
  if (selectedPeriod && autoQuestionCount !== g.questionCount) {
    g.setQuestionCount(autoQuestionCount);
  }

  const toggleCategory = (categoryId: string) => {
    const isSelected = g.selectedCategoryIds.includes(categoryId);
    if (isSelected) {
      const orphanedSubIds = allSubcategories
        .filter(s => s.category_id === categoryId)
        .map(s => s.id);
      if (orphanedSubIds.length > 0) {
        g.setSelectedSubcategoryIds(g.selectedSubcategoryIds.filter(sid => !orphanedSubIds.includes(sid)));
      }
      g.setSelectedCategoryIds(g.selectedCategoryIds.filter(id => id !== categoryId));
    } else {
      g.setSelectedCategoryIds([...g.selectedCategoryIds, categoryId]);
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    if (g.selectedSubcategoryIds.includes(subcategoryId)) {
      g.setSelectedSubcategoryIds(g.selectedSubcategoryIds.filter(id => id !== subcategoryId));
    } else {
      g.setSelectedSubcategoryIds([...g.selectedSubcategoryIds, subcategoryId]);
    }
  };

  const updateAdvanced = (key: keyof AdvancedSettings, value: unknown) => {
    g.setAdvancedSettings({ ...g.advancedSettings, [key]: value });
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
          {/* Purpose Selector */}
          <PurposeSelector
            purpose={g.purpose}
            onPurposeChange={g.setPurpose}
            selectedMoodLevels={g.selectedMoodLevels}
            onMoodLevelsChange={g.setSelectedMoodLevels}
            isRTL={isRTL}
          />

          {/* Generation Period Selector */}
          <GenerationPeriodSelector
            selectedPeriodId={g.selectedPeriodId}
            periods={g.periods}
            purpose={g.purpose}
            activePeriodForPurpose={g.activePeriodForPurpose}
            isPeriodLocked={isPeriodLocked}
            isGenerationLocked={isGenerationLocked}
            onPeriodChange={(v) => {
              g.setSelectedPeriodId(v);
              if (v) {
                const period = g.periods.find(p => p.id === v);
                if (period) {
                  g.setSelectedCategoryIds((period.locked_category_ids || []) as string[]);
                  g.setSelectedSubcategoryIds((period.locked_subcategory_ids || []) as string[]);
                }
              }
            }}
            onExpirePeriod={g.handleExpirePeriod}
            onDeletePeriod={g.handleDeletePeriod}
            onCreatePeriodOpen={() => setCreatePeriodOpen(true)}
          />

          {/* Category & Subcategory Multi-Select */}
          <CategorySubcategorySelect
            activeCategories={activeCategories}
            allSubcategories={allSubcategories}
            effectiveCategoryIds={effectiveCategoryIds}
            effectiveSubcategoryIds={effectiveSubcategoryIds}
            isPeriodLocked={isPeriodLocked}
            categorySearch={categorySearch}
            subcategorySearch={subcategorySearch}
            isRTL={isRTL}
            onToggleCategory={toggleCategory}
            onToggleSubcategory={toggleSubcategory}
            onCategorySearchChange={setCategorySearch}
            onSubcategorySearchChange={setSubcategorySearch}
          />

          {/* Distribution Preview */}
          {selectedSubsForPreview.length > 0 && (
            <DistributionPreview subcategories={selectedSubsForPreview} questionCount={g.questionCount} />
          )}

          {/* Question Type Multi-Select */}
          <div className="space-y-2">
            <Label>{t('aiGenerator.questionType')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between font-normal">
                  <span className="truncate">
                    {g.questionTypes.length === 0
                      ? t('aiGenerator.typeMixed')
                      : t('aiGenerator.typesSelected', { count: g.questionTypes.length })}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[260px] p-0" align="start">
                <ScrollArea className="max-h-[240px] px-2 py-2">
                  {(g.purpose === 'wellness'
                    ? [
                        { value: 'likert_5', emoji: '📊', label: t('aiGenerator.typeScale') },
                        { value: 'multiple_choice', emoji: '☑️', label: t('aiGenerator.typeMCQ') },
                        { value: 'open_ended', emoji: '💬', label: t('aiGenerator.typeOpen') },
                        { value: 'numeric_scale', emoji: '🔢', label: t('aiGenerator.typeNumeric') },
                        { value: 'yes_no', emoji: '✅', label: t('aiGenerator.typeYesNo') },
                        { value: 'slider', emoji: '🎚️', label: t('aiGenerator.typeSlider') },
                        { value: 'emoji_rating', emoji: '😀', label: t('aiGenerator.typeEmojiRating') },
                      ]
                    : [
                        { value: 'likert_5', emoji: '📊', label: t('aiGenerator.typeLikert') },
                        { value: 'multiple_choice', emoji: '☑️', label: t('aiGenerator.typeMCQ') },
                        { value: 'open_ended', emoji: '💬', label: t('aiGenerator.typeOpen') },
                        { value: 'numeric_scale', emoji: '🔢', label: t('aiGenerator.typeNumeric') },
                        { value: 'yes_no', emoji: '✅', label: t('aiGenerator.typeYesNo') },
                        { value: 'ranking', emoji: '🏆', label: t('aiGenerator.typeRanking') },
                        { value: 'matrix', emoji: '📋', label: t('aiGenerator.typeMatrix') },
                      ]
                  ).map(opt => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                    >
                      <Checkbox
                        checked={g.questionTypes.includes(opt.value)}
                        onCheckedChange={() => {
                          if (g.questionTypes.includes(opt.value)) {
                            g.setQuestionTypes(g.questionTypes.filter(v => v !== opt.value));
                          } else {
                            g.setQuestionTypes([...g.questionTypes, opt.value]);
                          }
                        }}
                      />
                      <span>{opt.emoji} {opt.label}</span>
                    </label>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">{t('aiGenerator.typeMultiSelectHint')}</p>
          </div>

          {/* Question Count & Complexity */}
          <QuestionCountComplexity
            selectedPeriod={selectedPeriod}
            questionCount={g.questionCount}
            questionsPerDay={g.questionsPerDay}
            purpose={g.purpose}
            complexity={g.complexity}
            onQuestionCountChange={g.setQuestionCount}
            onQuestionsPerDayChange={g.setQuestionsPerDay}
            onComplexityChange={g.setComplexity}
            periodDays={periodDays}
            autoQuestionCount={autoQuestionCount}
          />

          {/* Tone */}
          <div className="space-y-2">
            <Label>{t('aiGenerator.tone')}</Label>
            <Select value={g.tone} onValueChange={g.setTone}>
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
                <Switch checked={g.advancedSettings.requireExplanation} onCheckedChange={v => updateAdvanced('requireExplanation', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.biasDetection')}</Label>
                <Switch checked={g.advancedSettings.enableBiasDetection} onCheckedChange={v => updateAdvanced('enableBiasDetection', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.ambiguityDetection')}</Label>
                <Switch checked={g.advancedSettings.enableAmbiguityDetection} onCheckedChange={v => updateAdvanced('enableAmbiguityDetection', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.duplicateDetection')}</Label>
                <Switch checked={g.advancedSettings.enableDuplicateDetection} onCheckedChange={v => updateAdvanced('enableDuplicateDetection', v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">{t('aiGenerator.criticPass')}</Label>
                <Switch checked={g.advancedSettings.enableCriticPass} onCheckedChange={v => updateAdvanced('enableCriticPass', v)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">{t('aiGenerator.minWordLength')}</Label>
                <Input
                  type="number" min={1} max={50}
                  value={g.advancedSettings.minWordLength}
                  onChange={e => updateAdvanced('minWordLength', parseInt(e.target.value) || 5)}
                  className="w-24"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Prerequisites Check */}
          {!prerequisitesMet && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <p className="font-medium mb-1">{t('aiGenerator.prerequisitesNotMet')}</p>
                <ul className="space-y-1">
                  <li className="flex items-center gap-1.5">
                    {activeCategories.length >= 3 ? <CheckCircle2 className="h-3 w-3 text-chart-2" /> : <XCircle className="h-3 w-3" />}
                    {t('aiGenerator.prerequisiteMinCategories')}
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-full">
                  <Button
                    onClick={g.handleGenerate}
                    disabled={g.isGenerating || !hasCategorySelected || isGenerationLocked || !prerequisitesMet}
                    className="w-full"
                    size="lg"
                  >
                    {g.isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin me-2" />
                        {t('aiGenerator.generating')}
                      </>
                    ) : isGenerationLocked ? (
                      <>
                        <Lock className="h-5 w-5 me-2" />
                        {t('aiGenerator.generate')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 me-2" />
                        {t('aiGenerator.generate')}
                      </>
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              {isGenerationLocked && (
                <TooltipContent>
                  <p>{t('aiGenerator.periodLockedGenerate')}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Reference Frameworks (separate card) */}
      <FrameworkSelector
        frameworks={g.referenceFrameworks}
        selectedFrameworkIds={g.selectedFrameworkIds}
        onSelectedChange={g.setSelectedFrameworkIds}
        onAdd={g.addFramework}
        onUpdate={g.updateFramework}
        onDelete={g.deleteFramework}
        isLoading={g.frameworksLoading}
        currentUserId={g.currentUserId}
      />

      {/* Knowledge Base (custom prompt + documents) */}
      <KnowledgeBasePanel
        documents={g.documents}
        onUpload={g.uploadDocument}
        onToggleDocument={g.toggleDocument}
        onDeleteDocument={g.deleteDocument}
        isUploading={g.isUploading}
        customPrompt={g.customPrompt}
        onCustomPromptChange={g.setCustomPrompt}
        onRewritePrompt={g.handleRewritePrompt}
        isRewriting={g.isRewriting}
      />

      {/* Create Period Dialog */}
      <CreatePeriodDialog
        open={createPeriodOpen}
        onOpenChange={setCreatePeriodOpen}
        categories={activeCategories}
        subcategories={allSubcategories.filter(s => s.is_active)}
        onConfirm={(params) => {
          g.handleCreatePeriod(params);
          setCreatePeriodOpen(false);
        }}
        isCreating={g.isCreatingPeriod}
        purpose={g.purpose}
        activePeriodForPurpose={g.activePeriodForPurpose}
      />
    </div>
  );
}