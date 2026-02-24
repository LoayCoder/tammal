import { useTranslation } from "react-i18next";
import { CheckSquare } from "lucide-react";
import HabitsPlanner from "@/components/mental-toolkit/practices/HabitsPlanner";

export default function HabitsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <div className="glass-card border-0 rounded-none border-b border-border/50 px-4 py-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("mentalToolkit.habits.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.habits.subtitle")}</p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <HabitsPlanner />
      </div>
    </div>
  );
}
