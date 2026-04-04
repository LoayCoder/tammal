import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Wind, BookOpen, CheckSquare, ClipboardCheck,
} from 'lucide-react';
import BreathingGroundingTool from '@/components/mental-toolkit/tools/BreathingGroundingTool';
import JournalingPromptsTool from '@/components/mental-toolkit/practices/JournalingPromptsTool';
import HabitsPlanner from '@/components/mental-toolkit/practices/HabitsPlanner';
import SelfAssessmentQuiz from '@/components/mental-toolkit/resources/SelfAssessmentQuiz';
import { typography } from "@/theme/tokens";

type ToolKey = 'breathing' | 'journaling' | 'habits' | 'assessment';

const TOOLS: { key: ToolKey; icon: typeof Wind; color: string; titleKey: string }[] = [
  { key: 'breathing',   icon: Wind,           color: 'text-chart-3', titleKey: 'home.breathingGrounding' },
  { key: 'journaling',  icon: BookOpen,       color: 'text-chart-4', titleKey: 'home.dailyJournaling' },
  { key: 'habits',      icon: CheckSquare,    color: 'text-chart-1', titleKey: 'home.habitsPlanner' },
  { key: 'assessment',  icon: ClipboardCheck, color: 'text-chart-2', titleKey: 'home.selfAssessment' },
];

export function MentalHealthToolsHub() {
  const { t } = useTranslation();
  const [openTool, setOpenTool] = useState<ToolKey | null>(null);

  return (
    <>
      <div className="space-y-4">
        <h2 className={typography.sectionTitle}>{t('home.mentalHealthTools', 'Mental Health Tools')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(({ key, icon: Icon, color, titleKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpenTool(key)}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/40 bg-card p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
            >
              <Icon className={`h-5 w-5 ${color} transition-transform duration-200 group-hover:scale-110`} strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground/80 text-center leading-tight">{t(titleKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openTool === 'breathing'} onOpenChange={(open) => !open && setOpenTool(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-chart-3" strokeWidth={1.5} />
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
              <BookOpen className="h-5 w-5 text-chart-4" strokeWidth={1.5} />
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
              <CheckSquare className="h-5 w-5 text-chart-1" strokeWidth={1.5} />
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
              <ClipboardCheck className="h-5 w-5 text-chart-2" strokeWidth={1.5} />
              {t('home.selfAssessment', 'Self-Assessment Quizzes')}
            </DialogTitle>
          </DialogHeader>
          <SelfAssessmentQuiz />
        </DialogContent>
      </Dialog>
    </>
  );
}
