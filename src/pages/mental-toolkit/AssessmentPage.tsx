import { useTranslation } from "react-i18next";
import { ClipboardCheck } from "lucide-react";
import SelfAssessmentQuiz from "@/components/mental-toolkit/resources/SelfAssessmentQuiz";

export default function AssessmentPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-5 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #C9B8E8, #9BB5D8)" }}>
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("mentalToolkit.quiz.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("mentalToolkit.quiz.subtitle")}</p>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <SelfAssessmentQuiz />
      </div>
    </div>
  );
}
