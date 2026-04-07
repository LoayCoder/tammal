import {
  LayoutDashboard,
  Heart,
  Brain,
  Target,
  Trophy,
  Moon,
  HeartHandshake,
  Settings,
} from 'lucide-react';

export interface TourStep {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  targetSelector?: string;
  route?: string;
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    titleKey: 'onboarding.steps.welcome.title',
    descriptionKey: 'onboarding.steps.welcome.description',
    icon: LayoutDashboard,
  },
  {
    id: 'dashboard',
    titleKey: 'onboarding.steps.dashboard.title',
    descriptionKey: 'onboarding.steps.dashboard.description',
    icon: LayoutDashboard,
    route: '/',
  },
  {
    id: 'wellness',
    titleKey: 'onboarding.steps.wellness.title',
    descriptionKey: 'onboarding.steps.wellness.description',
    icon: Heart,
  },
  {
    id: 'mentalToolkit',
    titleKey: 'onboarding.steps.mentalToolkit.title',
    descriptionKey: 'onboarding.steps.mentalToolkit.description',
    icon: Brain,
  },
  {
    id: 'workload',
    titleKey: 'onboarding.steps.workload.title',
    descriptionKey: 'onboarding.steps.workload.description',
    icon: Target,
  },
  {
    id: 'recognition',
    titleKey: 'onboarding.steps.recognition.title',
    descriptionKey: 'onboarding.steps.recognition.description',
    icon: Trophy,
  },
  {
    id: 'spiritual',
    titleKey: 'onboarding.steps.spiritual.title',
    descriptionKey: 'onboarding.steps.spiritual.description',
    icon: Moon,
  },
  {
    id: 'support',
    titleKey: 'onboarding.steps.support.title',
    descriptionKey: 'onboarding.steps.support.description',
    icon: HeartHandshake,
  },
  {
    id: 'settings',
    titleKey: 'onboarding.steps.settings.title',
    descriptionKey: 'onboarding.steps.settings.description',
    icon: Settings,
  },
];
