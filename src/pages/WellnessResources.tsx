import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Brain, Wind, BookOpen, Music,
  CheckSquare, BookMarked, ClipboardCheck, Heart,
} from 'lucide-react';
import PageHeader from '@/components/system/PageHeader';

const RESOURCES = [
  { key: 'mood',        icon: Activity,       color: 'text-chart-1', titleKey: 'home.moodTracker',        route: '/mental-toolkit/mood-tracker' },
  { key: 'thought',     icon: Brain,          color: 'text-chart-4', titleKey: 'home.thoughtReframer',     route: '/mental-toolkit/thought-reframer' },
  { key: 'breathing',   icon: Wind,           color: 'text-chart-3', titleKey: 'home.breathingGrounding',  route: '/mental-toolkit/breathing' },
  { key: 'journaling',  icon: BookOpen,       color: 'text-chart-4', titleKey: 'home.dailyJournaling',     route: '/mental-toolkit/journaling' },
  { key: 'meditation',  icon: Music,          color: 'text-chart-2', titleKey: 'home.meditationLibrary',   route: '/mental-toolkit/meditation' },
  { key: 'habits',      icon: CheckSquare,    color: 'text-chart-1', titleKey: 'home.habitsPlanner',       route: '/mental-toolkit/habits' },
  { key: 'articles',    icon: BookMarked,     color: 'text-chart-3', titleKey: 'home.psychoeducation',     route: '/mental-toolkit/articles' },
  { key: 'assessment',  icon: ClipboardCheck, color: 'text-chart-2', titleKey: 'home.selfAssessment',      route: '/mental-toolkit/assessment' },
] as const;

export default function WellnessResources() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        icon={<Heart className="h-5 w-5" strokeWidth={1.5} />}
        title={t('home.wellnessResources', 'Wellness Resources')}
        subtitle={t('home.wellnessResourcesSubtitle', 'Tools to support your mental wellbeing')}
        maxWidth="2xl"
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {RESOURCES.map(({ key, icon: Icon, color, titleKey, route }) => (
            <button
              key={key}
              type="button"
              onClick={() => navigate(route)}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/40 bg-card p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
            >
              <Icon className={`h-5 w-5 ${color} transition-transform duration-200 group-hover:scale-110`} strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground/80 text-center leading-tight">{t(titleKey)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
