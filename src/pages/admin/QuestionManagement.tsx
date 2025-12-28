import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionTable } from "@/components/questions/QuestionTable";
import { QuestionDialog } from "@/components/questions/QuestionDialog";
import { useQuestions, CreateQuestionInput, Question } from "@/hooks/useQuestions";
import { useQuestionCategories } from "@/hooks/useQuestionCategories";
import { Plus, Search, Eye, EyeOff } from "lucide-react";

export default function QuestionManagement() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const { questions, isLoading, createQuestion, updateQuestion, deleteQuestion, bulkUpdateStatus } = useQuestions(selectedCategory);
  const { categories } = useQuestionCategories();

  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(search.toLowerCase()) ||
    (q.text_ar && q.text_ar.includes(search))
  );

  const handleSubmit = (data: CreateQuestionInput) => {
    if (editingQuestion) {
      updateQuestion.mutate({ id: editingQuestion.id, ...data }, {
        onSuccess: () => {
          setDialogOpen(false);
          setEditingQuestion(null);
        }
      });
    } else {
      createQuestion.mutate(data, {
        onSuccess: () => setDialogOpen(false)
      });
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setDialogOpen(true);
  };

  const handleToggleStatus = (id: string, isActive: boolean) => {
    updateQuestion.mutate({ id, is_active: isActive });
  };

  const handleBulkActivate = () => {
    bulkUpdateStatus.mutate({ ids: selectedIds, is_active: true });
    setSelectedIds([]);
  };

  const handleBulkDeactivate = () => {
    bulkUpdateStatus.mutate({ ids: selectedIds, is_active: false });
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('questions.title')}</h1>
          <p className="text-muted-foreground">{t('questions.subtitle')}</p>
        </div>
        <Button onClick={() => { setEditingQuestion(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 me-2" />
          {t('questions.addQuestion')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('questions.library')}</CardTitle>
          <CardDescription>{t('questions.libraryDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('questions.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {t('questions.selected', { count: selectedIds.length })}
                </span>
                <Button variant="outline" size="sm" onClick={handleBulkActivate}>
                  <Eye className="h-4 w-4 me-2" />
                  {t('questions.activate')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkDeactivate}>
                  <EyeOff className="h-4 w-4 me-2" />
                  {t('questions.deactivate')}
                </Button>
              </div>
            )}
          </div>

          <Tabs value={selectedCategory || 'all'} onValueChange={(v) => setSelectedCategory(v === 'all' ? undefined : v)}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id}>
                  <span className="w-2 h-2 rounded-full me-2" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <QuestionTable
            questions={filteredQuestions}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onEdit={handleEdit}
            onDelete={(id) => deleteQuestion.mutate(id)}
            onToggleStatus={handleToggleStatus}
          />
        </CardContent>
      </Card>

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={editingQuestion}
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={createQuestion.isPending || updateQuestion.isPending}
      />
    </div>
  );
}
