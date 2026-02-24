import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, BookOpen, LifeBuoy } from "lucide-react";
import MoodTrackerTool from "@/components/mental-toolkit/tools/MoodTrackerTool";
import ThoughtReframerTool from "@/components/mental-toolkit/tools/ThoughtReframerTool";
import BreathingGroundingTool from "@/components/mental-toolkit/tools/BreathingGroundingTool";
import JournalingPromptsTool from "@/components/mental-toolkit/practices/JournalingPromptsTool";
import MeditationLibraryTool from "@/components/mental-toolkit/practices/MeditationLibraryTool";
import HabitsPlanner from "@/components/mental-toolkit/practices/HabitsPlanner";
import PsychoeducationArticles from "@/components/mental-toolkit/resources/PsychoeducationArticles";
import SelfAssessmentQuiz from "@/components/mental-toolkit/resources/SelfAssessmentQuiz";

export default function MentalToolkit() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("tools");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C9B8E8, #A8C5A0)" }}>
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("mentalToolkit.pageTitle")}</h1>
              <p className="text-sm text-muted-foreground">{t("mentalToolkit.pageSubtitle")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-auto p-1 rounded-2xl mb-6" style={{ background: "hsl(var(--muted))" }}>
            <TabsTrigger
              value="tools"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl text-xs font-medium data-[state=active]:text-foreground"
              style={{
                ...(activeTab === "tools" ? { background: "#C9B8E8", color: "#4A3F6B" } : {})
              }}
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">{t("mentalToolkit.tabs.tools")}</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
            <TabsTrigger
              value="practices"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl text-xs font-medium data-[state=active]:text-foreground"
              style={{
                ...(activeTab === "practices" ? { background: "#A8C5A0", color: "#2d4a2a" } : {})
              }}
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t("mentalToolkit.tabs.practices")}</span>
              <span className="sm:hidden">Practices</span>
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="flex flex-col items-center gap-1 py-2 px-2 rounded-xl text-xs font-medium data-[state=active]:text-foreground"
              style={{
                ...(activeTab === "resources" ? { background: "#FAD7A0", color: "#7a4a00" } : {})
              }}
            >
              <LifeBuoy className="h-4 w-4" />
              <span className="hidden sm:inline">{t("mentalToolkit.tabs.resources")}</span>
              <span className="sm:hidden">Resources</span>
            </TabsTrigger>
          </TabsList>

          {/* Mental Tools Tab */}
          <TabsContent value="tools" className="space-y-6 animate-in fade-in duration-300">
            <MoodTrackerTool />
            <ThoughtReframerTool />
            <BreathingGroundingTool />
          </TabsContent>

          {/* Mental Practices Tab */}
          <TabsContent value="practices" className="space-y-6 animate-in fade-in duration-300">
            <JournalingPromptsTool />
            <MeditationLibraryTool />
            <HabitsPlanner />
          </TabsContent>

          {/* Mental Resources Tab */}
          <TabsContent value="resources" className="space-y-6 animate-in fade-in duration-300">
            <PsychoeducationArticles />
            <SelfAssessmentQuiz />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
