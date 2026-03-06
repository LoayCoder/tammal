import { useTranslation } from "react-i18next";
import { ClipboardCheck } from "lucide-react";
import SelfAssessmentQuiz from "@/components/mental-toolkit/resources/SelfAssessmentQuiz";
import { ToolkitPageHeader } from "@/components/mental-toolkit/shared";

export default function AssessmentPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <ToolkitPageHeader
        icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
        title={t("mentalToolkit.quiz.title")}
        subtitle={t("mentalToolkit.quiz.subtitle")}
      />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
        <SelfAssessmentQuiz />
      </div>
    </div>
  );
}
