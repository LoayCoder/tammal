import { useTranslation } from "react-i18next";
import { BookMarked } from "lucide-react";
import PsychoeducationArticles from "@/features/mental-toolkit/components/resources/PsychoeducationArticles";
import { ToolkitPageHeader } from "@/features/mental-toolkit/components/shared";

export default function ArticlesPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <ToolkitPageHeader
        icon={<BookMarked className="h-5 w-5 text-primary" />}
        title={t("mentalToolkit.articles.title")}
        subtitle={t("mentalToolkit.articles.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <PsychoeducationArticles />
      </div>
    </div>
  );
}

