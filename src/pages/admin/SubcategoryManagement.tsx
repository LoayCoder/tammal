import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubcategoryDialog } from "@/components/questions/SubcategoryDialog";
import { useQuestionSubcategories, QuestionSubcategory, CreateSubcategoryInput } from "@/hooks/questions/useQuestionSubcategories";
import { useQuestionCategories } from "@/hooks/questions/useQuestionCategories";
import { CategoryBadge } from "@/components/questions/CategoryBadge";
import { Plus, MoreHorizontal, Edit2, Trash2, ToggleLeft, ToggleRight, GitBranch } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function SubcategoryManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionSubcategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');

  const { categories } = useQuestionCategories();
  const { subcategories: allSubcategories, isPending: isLoading, createSubcategory, updateSubcategory, deleteSubcategory } = useQuestionSubcategories();
  const MAX_SUBCATEGORIES_PER_CATEGORY = 5;

  // Filter for display
  const subcategories = filterCategoryId !== 'all' 
    ? allSubcategories.filter(s => s.category_id === filterCategoryId) 
    : allSubcategories;

  const getSubcategoryCountForCategory = (categoryId: string) =>
    allSubcategories.filter(s => s.category_id === categoryId).length;

  const handleSubmit = (data: CreateSubcategoryInput) => {
    if (editing) {
      updateSubcategory.mutate({ id: editing.id, ...data }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    } else {
      // Check limit before creating
      const currentCount = getSubcategoryCountForCategory(data.category_id);
      if (currentCount >= MAX_SUBCATEGORIES_PER_CATEGORY) {
        toast.error(t('subcategories.maxReached', { max: MAX_SUBCATEGORIES_PER_CATEGORY }));
        return;
      }
      createSubcategory.mutate(data, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleEdit = (sub: QuestionSubcategory) => { setEditing(sub); setDialogOpen(true); };
  const handleToggle = (sub: QuestionSubcategory) => { updateSubcategory.mutate({ id: sub.id, is_active: !sub.is_active }); };

  const getCategoryForId = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><GitBranch className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('subcategories.title')}</h1>
            <p className="text-muted-foreground">{t('subcategories.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />{t('subcategories.addSubcategory')}
        </Button>
      </div>

      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('subcategories.title')}</CardTitle>
              <CardDescription>{t('subcategories.subtitle')}</CardDescription>
            </div>
            <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('subcategories.parentCategory')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{isRTL && c.name_ar ? c.name_ar : c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categories.name')}</TableHead>
                  <TableHead>{t('subcategories.parentCategory')}</TableHead>
                  <TableHead>{t('categories.weight')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-12">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('subcategories.noSubcategories')}
                    </TableCell>
                  </TableRow>
                ) : subcategories.map(sub => {
                  const parent = getCategoryForId(sub.category_id);
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sub.color }} />
                          <span className="font-medium">{isRTL && sub.name_ar ? sub.name_ar : sub.name}</span>
                          {sub.is_global && <Badge variant="secondary" className="text-xs">{t('categories.global')}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {parent ? <CategoryBadge name={parent.name} nameAr={parent.name_ar} color={parent.color} /> : '-'}
                      </TableCell>
                      <TableCell>{sub.weight}</TableCell>
                      <TableCell>
                        <Badge variant={sub.is_active ? "default" : "secondary"}>
                          {sub.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(sub)}>
                              <Edit2 className="h-4 w-4 me-2" />{t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggle(sub)}>
                              {sub.is_active ? <ToggleRight className="h-4 w-4 me-2" /> : <ToggleLeft className="h-4 w-4 me-2" />}
                              {sub.is_active ? t('categories.deactivate') : t('categories.activate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(sub.id)}>
                              <Trash2 className="h-4 w-4 me-2" />{t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SubcategoryDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        subcategory={editing} onSubmit={handleSubmit}
        isLoading={createSubcategory.isPending || updateSubcategory.isPending}
        defaultCategoryId={filterCategoryId !== 'all' ? filterCategoryId : undefined}
        existingSubcategories={allSubcategories}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('subcategories.deleteSubcategory')}</AlertDialogTitle>
            <AlertDialogDescription>{t('subcategories.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteSubcategory.mutate(deleteId); setDeleteId(null); } }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
