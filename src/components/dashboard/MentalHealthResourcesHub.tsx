import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Music, BookMarked, Calendar, ChevronRight,
} from 'lucide-react';
import MeditationLibraryTool from '@/components/mental-toolkit/practices/MeditationLibraryTool';
import PsychoeducationArticles from '@/components/mental-toolkit/resources/PsychoeducationArticles';
import IslamicCalendar from '@/pages/spiritual/IslamicCalendar';
import { cardVariants, typography} from "@/theme/tokens";
import { cn } from "@/lib/utils";

type ResourceKey = 'meditation' | 'articles' | 'calendar';

const RESOURCES: { key: ResourceKey; icon: typeof Music; color: string; titleKey: string; descKey: string }[] = [
  { key: 'meditation', icon: Music,      color: 'primary', titleKey: 'home.meditationLibrary',         descKey: 'home.meditationLibraryDesc' },
  { key: 'articles',   icon: BookMarked, color: 'chart-5', titleKey: 'home.psychoeducationArticles',   descKey: 'home.psychoeducationArticlesDesc' },
  { key: 'calendar',   icon: Calendar,   color: 'chart-3', titleKey: 'home.islamicCalendar',           descKey: 'home.islamicCalendarDesc' },
];

export function MentalHealthResourcesHub() {
  const { t } = useTranslation();
  const [openResource, setOpenResource] = useState<ResourceKey | null>(null);

  return (
    <>
      <div className="space-y-2">
        <h2 className={typography.sectionTitle}>{t('home.mentalHealthResources', 'Mental Health Resources')}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {RESOURCES.map(({ key, icon: Icon, color, titleKey }) => (
            <div
              key={key}
              onClick={() => setOpenResource(key)}
              className="flex flex-col items-center gap-1.5 rounded-xl py-4 px-2 cursor-pointer transition-colors bg-[hsl(var(--trend-positive))]/[0.04]"
            >
              <Icon className={"h-5 w-5 text-" + color} strokeWidth={1.5} />
              <span className="text-xs font-medium text-center leading-tight">{t(titleKey)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openResource === 'meditation'} onOpenChange={(open) => !open && setOpenResource(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              {t('home.meditationLibrary', 'Meditation Library')}
            </DialogTitle>
          </DialogHeader>
          <MeditationLibraryTool />
        </DialogContent>
      </Dialog>

      <Dialog open={openResource === 'articles'} onOpenChange={(open) => !open && setOpenResource(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookMarked className="h-5 w-5 text-chart-5" />
              {t('home.psychoeducationArticles', 'Psychoeducation Articles')}
            </DialogTitle>
          </DialogHeader>
          <PsychoeducationArticles />
        </DialogContent>
      </Dialog>

      <Dialog open={openResource === 'calendar'} onOpenChange={(open) => !open && setOpenResource(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-chart-3" />
              {t('home.islamicCalendar', 'Islamic Calendar')}
            </DialogTitle>
          </DialogHeader>
          <IslamicCalendar />
        </DialogContent>
      </Dialog>
    </>
  );
}
