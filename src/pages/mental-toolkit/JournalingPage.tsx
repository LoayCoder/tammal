import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import JournalingPromptsTool from "@/components/mental-toolkit/practices/JournalingPromptsTool";
import { ToolkitPageHeader } from "@/components/mental-toolkit/shared";

export default function JournalingPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <ToolkitPageHeader
        icon={<BookOpen className="h-5 w-5 text-primary" />}
        title={t("mentalToolkit.journaling.title")}
        subtitle={t("mentalToolkit.journaling.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <JournalingPromptsTool />
      </div>
    </div>
  );
}
