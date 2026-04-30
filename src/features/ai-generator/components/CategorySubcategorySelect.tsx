import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronsUpDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
  color?: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_ar: string | null;
  color?: string;
}

interface CategorySubcategorySelectProps {
  activeCategories: Category[];
  allSubcategories: Subcategory[];
  effectiveCategoryIds: string[];
  effectiveSubcategoryIds: string[];
  isPeriodLocked: boolean;
  categorySearch: string;
  subcategorySearch: string;
  isRTL: boolean;
  onToggleCategory: (id: string) => void;
  onToggleSubcategory: (id: string) => void;
  onCategorySearchChange: (v: string) => void;
  onSubcategorySearchChange: (v: string) => void;
}

export function CategorySubcategorySelect({
  activeCategories,
  allSubcategories,
  effectiveCategoryIds,
  effectiveSubcategoryIds,
  isPeriodLocked,
  categorySearch,
  subcategorySearch,
  isRTL,
  onToggleCategory,
  onToggleSubcategory,
  onCategorySearchChange,
  onSubcategorySearchChange,
}: CategorySubcategorySelectProps) {
  const { t } = useTranslation();

  const filteredSubcategories = allSubcategories.filter(
    s => effectiveCategoryIds.includes(s.category_id)
  );

  const getCategoryLabel = (c: Category) => isRTL && c.name_ar ? c.name_ar : c.name;
  const getSubcategoryLabel = (s: Subcategory) => isRTL && s.name_ar ? s.name_ar : s.name;

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

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Categories Multi-Select */}
      <div className="space-y-2">
        <Label>{t('aiGenerator.category')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between font-normal" disabled={isPeriodLocked}>
              <span className="truncate">
                {effectiveCategoryIds.length === 0
                  ? t('aiGenerator.selectCategories')
                  : t('aiGenerator.categoriesSelected', { count: effectiveCategoryIds.length })}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" align="start">
            <div className="p-2">
              <Input
                placeholder={t('aiGenerator.searchCategories')}
                value={categorySearch}
                onChange={e => onCategorySearchChange(e.target.value)}
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
                    checked={effectiveCategoryIds.includes(c.id)}
                    onCheckedChange={() => onToggleCategory(c.id)}
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
              disabled={isPeriodLocked || effectiveCategoryIds.length === 0}
            >
              <span className="truncate">
                {effectiveCategoryIds.length === 0
                  ? t('aiGenerator.selectSubcategories')
                  : effectiveSubcategoryIds.length === 0
                    ? t('aiGenerator.selectSubcategories')
                    : t('aiGenerator.categoriesSelected', { count: effectiveSubcategoryIds.length })}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" align="start">
            <div className="p-2">
              <Input
                placeholder={t('aiGenerator.searchSubcategories')}
                value={subcategorySearch}
                onChange={e => onSubcategorySearchChange(e.target.value)}
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
                      checked={effectiveSubcategoryIds.includes(s.id)}
                      onCheckedChange={() => onToggleSubcategory(s.id)}
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
  );
}