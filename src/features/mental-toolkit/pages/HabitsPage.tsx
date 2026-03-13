import { useTranslation } from "react-i18next";
import { CheckSquare } from "lucide-react";
import HabitsPlanner from "@/features/mental-toolkit/components/practices/HabitsPlanner";
import { ToolkitPageHeader } from "@/features/mental-toolkit/components/shared";

export default function HabitsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <ToolkitPageHeader
        icon={<CheckSquare className="h-5 w-5 text-primary" />}
        title={t("mentalToolkit.habits.title")}
        subtitle={t("mentalToolkit.habits.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <HabitsPlanner />
      </div>
    </div>
  );
}

