import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import {
  Music, BookMarked, Calendar, ChevronRight,
} from 'lucide-react';
import MeditationLibraryTool from '@/features/mental-toolkit/components/practices/MeditationLibraryTool';
import PsychoeducationArticles from '@/features/mental-toolkit/components/resources/PsychoeducationArticles';
import IslamicCalendar from '@/features/spiritual/pages/IslamicCalendar';

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
        <h2 className="text-lg font-semibold">{t('home.mentalHealthResources', 'Mental Health Resources')}</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {RESOURCES.map(({ key, icon: Icon, color, titleKey, descKey }) => (
            <div key={key} onClick={() => setOpenResource(key)} className="cursor-pointer">
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


