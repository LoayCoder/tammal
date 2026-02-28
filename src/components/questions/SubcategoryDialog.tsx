import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuestionCategories } from "@/hooks/questions/useQuestionCategories";
import { QuestionSubcategory, CreateSubcategoryInput } from "@/hooks/questions/useQuestionSubcategories";

interface SubcategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategory?: QuestionSubcategory | null;
  onSubmit: (data: CreateSubcategoryInput) => void;
  isLoading?: boolean;
  defaultCategoryId?: string;
  existingSubcategories?: QuestionSubcategory[];
}

export function SubcategoryDialog({
  open, onOpenChange, subcategory, onSubmit, isLoading, defaultCategoryId, existingSubcategories = [],
}: SubcategoryDialogProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const { categories } = useQuestionCategories();

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [weight, setWeight] = useState(1);
  const [isActive, setIsActive] = useState(true);

  // Auto-inherit color from parent category
  const parentCategory = categories.find(c => c.id === categoryId);
  const inheritedColor = parentCategory?.color || '#3B82F6';

  useEffect(() => {
    if (subcategory) {
      setCategoryId(subcategory.category_id);
      setName(subcategory.name);
      setNameAr(subcategory.name_ar || "");
      setDescription(subcategory.description || "");
      setDescriptionAr(subcategory.description_ar || "");
      setWeight(subcategory.weight);
      setIsActive(subcategory.is_active);
    } else {
      setCategoryId(defaultCategoryId || "");
      setName("");
      setNameAr("");
      setDescription("");
      setDescriptionAr("");
      setWeight(1);
      setIsActive(true);
    }
  }, [subcategory, open, defaultCategoryId]);

  // Deduplication: scope to siblings in same category
  const siblings = useMemo(() =>
    existingSubcategories.filter(s => s.category_id === categoryId && s.id !== subcategory?.id),
    [existingSubcategories, categoryId, subcategory?.id]
  );
  const isNameTaken = siblings.some(s => s.name.toLowerCase() === name.trim().toLowerCase());
  const isNameArTaken = !!(nameAr.trim() && siblings.some(s => s.name_ar?.toLowerCase() === nameAr.trim().toLowerCase()));

  // Max 5 subcategories per category enforcement
  const isMaxReached = !subcategory && siblings.length >= 5;

  const canSave = name.trim() && categoryId && !isNameTaken && !isNameArTaken && !isMaxReached;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      category_id: categoryId,
      name,
      name_ar: nameAr || undefined,
      description: description || undefined,
      description_ar: descriptionAr || undefined,
      color: inheritedColor,
      weight,
      is_active: isActive,
      is_global: false,
    });
  };

  const activeCategories = categories.filter(c => c.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subcategory ? t('subcategories.editSubcategory') : t('subcategories.addSubcategory')}
          </DialogTitle>
          <DialogDescription>
            {subcategory ? t('subcategories.editSubcategory') : t('subcategories.addSubcategory')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('subcategories.parentCategory')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder={t('aiGenerator.selectCategory')} /></SelectTrigger>
              <SelectContent>
                {activeCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {isRTL && c.name_ar ? c.name_ar : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('categories.name')} (English)</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
              {isNameTaken && (
                <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t('subcategories.nameTaken')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t('categories.name')} (العربية)</Label>
              <Input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl" />
              {isNameArTaken && (
                <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t('subcategories.nameArTaken')}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('categories.description')} (English)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{t('categories.description')} (العربية)</Label>
            <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} rows={2} dir="rtl" />
          </div>

          {/* Color inherited from parent - read only */}
          <div className="space-y-2">
            <Label>{t('categories.color')}</Label>
            <Alert className="py-2">
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full shrink-0 border"
                  style={{ backgroundColor: inheritedColor }}
                />
                <span className="text-xs">{t('subcategories.colorInherited')}</span>
              </AlertDescription>
            </Alert>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('categories.weight')}</Label>
              <Input type="number" min={0} max={10} step={0.1} value={weight} onChange={e => setWeight(parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{t('categories.isActive')}</Label>
            </div>
          </div>

          {isMaxReached && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t('subcategories.maxPerCategory', { defaultValue: 'Maximum 5 subcategories per category' })}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isLoading || !canSave}>{subcategory ? t('common.save') : t('common.create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
