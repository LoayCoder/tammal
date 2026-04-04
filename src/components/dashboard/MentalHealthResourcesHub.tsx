import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Music, BookMarked, Calendar,
} from 'lucide-react';
import MeditationLibraryTool from '@/components/mental-toolkit/practices/MeditationLibraryTool';
import PsychoeducationArticles from '@/components/mental-toolkit/resources/PsychoeducationArticles';
import IslamicCalendar from '@/pages/spiritual/IslamicCalendar';
import { typography } from "@/theme/tokens";

type ResourceKey = 'meditation' | 'articles' | 'calendar';

const RESOURCES: { key: ResourceKey; icon: typeof Music; color: string; titleKey: string }[] = [
  { key: 'meditation', icon: Music,      color: 'text-primary',  titleKey: 'home.meditationLibrary' },
  { key: 'articles',   icon: BookMarked, color: 'text-chart-5',  titleKey: 'home.psychoeducationArticles' },
  { key: 'calendar',   icon: Calendar,   color: 'text-chart-3',  titleKey: 'home.islamicCalendar' },
];

export function MentalHealthResourcesHub() {
  const { t } = useTranslation();
  const [openResource, setOpenResource] = useState<ResourceKey | null>(null);

  return (
    <>
      <div className="space-y-4">
        <h2 className={typography.sectionTitle}>{t('home.mentalHealthResources', 'Mental Health Resources')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {RESOURCES.map(({ key, icon: Icon, color, titleKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => setOpenResource(key)}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-border/40 bg-card p-5 cursor-pointer transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 hover:border-primary/20 active:scale-[0.98]"
            >
              <Icon className={`h-5 w-5 ${color} transition-transform duration-200 group-hover:scale-110`} strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground/80 text-center leading-tight">{t(titleKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openResource === 'meditation'} onOpenChange={(open) => !open && setOpenResource(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" strokeWidth={1.5} />
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
              <BookMarked className="h-5 w-5 text-chart-5" strokeWidth={1.5} />
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
              <Calendar className="h-5 w-5 text-chart-3" strokeWidth={1.5} />
              {t('home.islamicCalendar', 'Islamic Calendar')}
            </DialogTitle>
          </DialogHeader>
          <IslamicCalendar />
        </DialogContent>
      </Dialog>
    </>
  );
}
