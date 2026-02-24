import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CategoryDialog } from "@/components/questions/CategoryDialog";
import { useQuestionCategories, QuestionCategory, CreateCategoryInput } from "@/hooks/useQuestionCategories";
import { Plus, MoreHorizontal, Edit2, Trash2, ToggleLeft, ToggleRight, Tags } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function CategoryManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QuestionCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useQuestionCategories();
  const MAX_CATEGORIES = 5;
  const canAddCategory = categories.length < MAX_CATEGORIES;

  const handleSubmit = (data: CreateCategoryInput) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingCategory(null);
        }
      });
    } else {
      createCategory.mutate(data, {
        onSuccess: () => setDialogOpen(false)
      });
    }
  };

  const handleEdit = (category: QuestionCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Tags className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('categories.title')}</h1>
            <p className="text-muted-foreground">{t('categories.subtitle')}</p>
          </div>
        </div>
        <Button 
          onClick={() => {
            if (!canAddCategory) {
              toast.error(t('categories.maxReached', { max: MAX_CATEGORIES }));
              return;
            }
            setEditingCategory(null); 
            setDialogOpen(true); 
          }}
          disabled={!canAddCategory}
        >
          <Plus className="h-4 w-4 me-2" />
          {t('categories.addCategory')} ({categories.length}/{MAX_CATEGORIES})
        </Button>
      </div>

      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle>{t('categories.list')}</CardTitle>
          <CardDescription>{t('categories.listDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('categories.name')}</TableHead>
                  <TableHead>{t('categories.description')}</TableHead>
                  <TableHead>{t('categories.weight')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-12">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {t('categories.noCategories')}
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="font-medium">
                            {isRTL && category.name_ar ? category.name_ar : category.name}
                          </span>
                          {category.is_global && (
                            <Badge variant="secondary" className="text-xs">{t('categories.global')}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-md truncate">
                        {isRTL && category.description_ar ? category.description_ar : category.description || '-'}
                      </TableCell>
                      <TableCell>{category.weight}</TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit2 className="h-4 w-4 me-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateCategory.mutate({ id: category.id, is_active: !category.is_active })}>
                              {category.is_active ? <ToggleRight className="h-4 w-4 me-2" /> : <ToggleLeft className="h-4 w-4 me-2" />}
                              {category.is_active ? t('categories.deactivate') : t('categories.activate')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(category.id)}>
                              <Trash2 className="h-4 w-4 me-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        onSubmit={handleSubmit}
        isLoading={createCategory.isPending || updateCategory.isPending}
        existingCategories={categories}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.deleteCategory')}</AlertDialogTitle>
            <AlertDialogDescription>{t('categories.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteCategory.mutate(deleteId); setDeleteId(null); } }}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
