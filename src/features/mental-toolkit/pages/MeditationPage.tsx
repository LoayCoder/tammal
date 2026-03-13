import { useTranslation } from "react-i18next";
import { Music } from "lucide-react";
import MeditationLibraryTool from "@/features/mental-toolkit/components/practices/MeditationLibraryTool";
import { ToolkitPageHeader } from "@/features/mental-toolkit/components/shared";

export default function MeditationPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <ToolkitPageHeader
        icon={<Music className="h-5 w-5 text-primary" />}
        title={t("mentalToolkit.meditation.title")}
        subtitle={t("mentalToolkit.meditation.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <MeditationLibraryTool />
      </div>
    </div>
  );
}

