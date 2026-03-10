import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Wind, BookOpen, CheckSquare, ClipboardCheck, ChevronRight,
} from 'lucide-react';
import BreathingGroundingTool from '@/components/mental-toolkit/tools/BreathingGroundingTool';
import JournalingPromptsTool from '@/components/mental-toolkit/practices/JournalingPromptsTool';
import HabitsPlanner from '@/components/mental-toolkit/practices/HabitsPlanner';
import SelfAssessmentQuiz from '@/components/mental-toolkit/resources/SelfAssessmentQuiz';

type ToolKey = 'breathing' | 'journaling' | 'habits' | 'assessment';

const TOOLS: { key: ToolKey; icon: typeof Wind; color: string; titleKey: string; descKey: string }[] = [
  { key: 'breathing',   icon: Wind,           color: 'chart-3', titleKey: 'home.breathingGrounding',  descKey: 'home.breathingGroundingDesc' },
  { key: 'journaling',  icon: BookOpen,       color: 'chart-4', titleKey: 'home.dailyJournaling',     descKey: 'home.dailyJournalingDesc' },
  { key: 'habits',      icon: CheckSquare,    color: 'chart-1', titleKey: 'home.habitsPlanner',       descKey: 'home.habitsPlannerDesc' },
  { key: 'assessment',  icon: ClipboardCheck, color: 'chart-2', titleKey: 'home.selfAssessment',      descKey: 'home.selfAssessmentDesc' },
];

export function MentalHealthToolsHub() {
  const { t } = useTranslation();
  const [openTool, setOpenTool] = useState<ToolKey | null>(null);

  return (
    <>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t('home.mentalHealthTools', 'Mental Health Tools')}</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {TOOLS.map(({ key, icon: Icon, color, titleKey, descKey }) => (
            <div key={key} onClick={() => setOpenTool(key)} className="cursor-pointer">
              <Card className={`glass-card border-0 ring-1 ring-${color}/20 cursor-pointer transition-all hover:shadow-lg hover:ring-${color}/40`}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-${color}/10`}>
                    <Icon className={`h-6 w-6 text-${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{t(titleKey)}</h3>
                    <p className="text-muted-foreground text-xs mt-0.5">{t(descKey)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 rtl:rotate-180" />
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openTool === 'breathing'} onOpenChange={(open) => !open && setOpenTool(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-chart-3" />
              {t('home.breathingGrounding', 'Breathing & Grounding')}
            </DialogTitle>
          </DialogHeader>
          <BreathingGroundingTool onComplete={() => setOpenTool(null)} onCancel={() => setOpenTool(null)} />
        </DialogContent>
      </Dialog>

      <Dialog open={openTool === 'journaling'} onOpenChange={(open) => !open && setOpenTool(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-chart-4" />
              {t('home.dailyJournaling', 'Daily Journaling Prompts')}
            </DialogTitle>
          </DialogHeader>
          <JournalingPromptsTool />
        </DialogContent>
      </Dialog>

      <Dialog open={openTool === 'habits'} onOpenChange={(open) => !open && setOpenTool(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-chart-1" />
              {t('home.habitsPlanner', 'Positive Habits Planner')}
            </DialogTitle>
          </DialogHeader>
          <HabitsPlanner />
        </DialogContent>
      </Dialog>

      <Dialog open={openTool === 'assessment'} onOpenChange={(open) => !open && setOpenTool(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-chart-2" />
              {t('home.selfAssessment', 'Self-Assessment Quizzes')}
            </DialogTitle>
          </DialogHeader>
          <SelfAssessmentQuiz />
        </DialogContent>
      </Dialog>
    </>
  );
}
