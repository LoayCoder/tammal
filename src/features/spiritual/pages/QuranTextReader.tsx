import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { BookOpen, ChevronRight, ChevronLeft, Search, ArrowUp, Timer } from 'lucide-react';
import { useQuranSurahList, useQuranSurah, SurahMeta } from '@/features/spiritual/hooks/spiritual/useQuranText';
import { useSpiritualPreferences } from '@/features/spiritual/hooks/spiritual/useSpiritualPreferences';
import { useReadingTimer } from '@/features/spiritual/hooks/spiritual/useReadingTimer';
import { ReadingSessionDialog } from '@/features/spiritual/components/ReadingSessionDialog';

const MIN_SESSION_SECONDS = 0;

function SurahList({
  surahs,
  onSelect,
  search,
  setSearch,
}: {
  surahs: SurahMeta[];
  onSelect: (n: number) => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const { t } = useTranslation();
  const filtered = surahs.filter(
    (s) =>
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.name.includes(search) ||
      String(s.number).includes(search)
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('spiritual.quranReader.searchSurah', 'Search surah...')}
          className="ps-9"
        />
      </div>
      <ScrollArea className="h-[calc(100vh-260px)]">
        <div className="space-y-1">
          {filtered.map((s) => (
            <button
              key={s.number}
              onClick={() => onSelect(s.number)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-start"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {s.number}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{s.englishName}</span>
                  <span className="text-base font-arabic text-end shrink-0">{s.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{s.englishNameTranslation}</span>
                  <span className="text-xs text-muted-foreground">• {s.numberOfAyahs} ayahs</span>
                  <Badge variant="outline" className="text-2xs px-1.5 py-0">
                    {s.revelationType}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 rtl:rotate-180" />
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('spiritual.quranReader.noResults', 'No surahs found')}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function toArabicNumeral(n: number): string {
  const digits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  return String(n).replace(/\d/g, d => digits[parseInt(d)]);
}

function SurahViewer({ surahNumber, onBack, onStopAndSave, elapsedSeconds, formatTime, initialAyah, onAyahChange }: {
  surahNumber: number;
  onBack: () => void;
  onStopAndSave: () => void;
  elapsedSeconds: number;
  formatTime: (s: number) => string;
  initialAyah?: number;
  onAyahChange?: (ayah: number) => void;
}) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuranSurah(surahNumber);
  const topRef = useRef<HTMLDivElement>(null);
  const ayahRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [showTranslation, setShowTranslation] = useState(true);

  // Scroll to initial ayah or top
  useEffect(() => {
    if (initialAyah && initialAyah > 1 && data) {
      const el = ayahRefs.current.get(initialAyah);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        return;
      }
    }
    topRef.current?.scrollIntoView();
  }, [surahNumber, data, initialAyah]);

  // IntersectionObserver to track last visible ayah
  useEffect(() => {
    if (!data) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let maxAyah = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const num = parseInt(entry.target.getAttribute('data-ayah') ?? '0');
            if (num > maxAyah) maxAyah = num;
          }
        });
        if (maxAyah > 0) onAyahChange?.(maxAyah);
      },
      { threshold: 0.5 }
    );
    ayahRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [data, onAyahChange]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 mx-auto" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-muted-foreground">{t('spiritual.quranReader.loadError', 'Failed to load surah')}</p>
        <Button variant="outline" onClick={onBack}>{t('common.back', 'Back')}</Button>
      </div>
    );
  }

  const { surah, verses } = data;
  const showBismillah = surah.number !== 1 && surah.number !== 9;

  return (
    <div className="space-y-6">
      <div ref={topRef} />

      {/* Back button + timer */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 text-xs font-mono">
            <Timer className="h-3 w-3" />
            {formatTime(elapsedSeconds)}
          </Badge>
          <Button
            variant="default"
            size="sm"
            onClick={onStopAndSave}
            className="gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t('spiritual.quranReader.stopAndSave', 'Stop & Save')}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTranslation(!showTranslation)}
          className="text-xs text-muted-foreground"
        >
          {showTranslation ? t('spiritual.quranReader.hideTranslation', 'Hide Translation') : t('spiritual.quranReader.showTranslation', 'Show Translation')}
        </Button>
      </div>

      {/* Ornamental Surah Header */}
      <div className="text-center space-y-2 py-6 border-y border-primary/15">
        <div className="flex items-center justify-center gap-3 text-primary/40 text-xs tracking-[0.3em] uppercase">
          <span className="h-px w-12 bg-primary/20" />
          {surah.revelationType}
          <span className="h-px w-12 bg-primary/20" />
        </div>
        <h2 className="text-4xl font-arabic text-primary" dir="rtl">{surah.name}</h2>
        <p className="text-sm text-muted-foreground">
          {surah.englishName} — {surah.englishNameTranslation}
        </p>
        <p className="text-xs text-muted-foreground/60">
          {surah.numberOfAyahs} {t('spiritual.quranReader.ayahs', 'Ayahs')} • {t('spiritual.quranReader.surahNum', 'Surah')} {surah.number}
        </p>
      </div>

      {/* Bismillah */}
      {showBismillah && (
        <p className="text-center text-2xl font-arabic py-2 text-primary/70" dir="rtl">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {/* Flowing Arabic Text */}
      <div
        dir="rtl"
        className="text-2xl md:text-3xl font-arabic leading-[2.5] text-foreground px-2 md:px-6 text-justify"
      >
        {verses.map((v) => (
          <span
            key={v.numberInSurah}
            data-ayah={v.numberInSurah}
            ref={(el) => { if (el) ayahRefs.current.set(v.numberInSurah, el); }}
          >
            {v.text}
            <span className="inline-flex items-center justify-center text-primary/50 text-base md:text-lg mx-1 font-sans select-none">
              ﴿{toArabicNumeral(v.numberInSurah)}﴾
            </span>
          </span>
        ))}
      </div>

      {/* Translation Section */}
      {showTranslation && (
        <div className="border-t border-primary/10 pt-6 space-y-0">
          <h3 className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-4 px-2">
            {t('spiritual.quranReader.translation', 'Translation')}
          </h3>
          {verses.map((v) => (
            <div
              key={v.numberInSurah}
              className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-b-0 px-2"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/8 text-2xs font-semibold text-primary/60 mt-0.5">
                {v.numberInSurah}
              </span>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {v.translation}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-primary/10">
        <Button
          variant="outline"
          size="sm"
          disabled={surah.number <= 1}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('quran-navigate', { detail: surah.number - 1 }));
          }}
          className="gap-1"
        >
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
          {t('spiritual.quranReader.prevSurah', 'Previous')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="gap-1 text-muted-foreground"
        >
          <ArrowUp className="h-3 w-3" />
          {t('spiritual.quranReader.backToTop', 'Top')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={surah.number >= 114}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('quran-navigate', { detail: surah.number + 1 }));
          }}
          className="gap-1"
        >
          {t('spiritual.quranReader.nextSurah', 'Next')}
          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        </Button>
      </div>

      {/* Floating Stop & Save Bar */}
      <div className="sticky bottom-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline" className="gap-1.5 text-xs font-mono shrink-0">
              <Timer className="h-3 w-3" />
              {formatTime(elapsedSeconds)}
            </Badge>
            <span className="text-sm text-muted-foreground truncate">
              {surah.englishName}
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onStopAndSave}
            className="gap-1.5 shrink-0"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t('spiritual.quranReader.stopAndSave', 'Stop & Save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function QuranTextReader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { preferences, isPending: prefsLoading } = useSpiritualPreferences();
  const { data: surahs = [], isPending: surahsLoading } = useQuranSurahList();
  const [search, setSearch] = useState('');

  const activeSurah = searchParams.get('surah') ? parseInt(searchParams.get('surah')!) : null;
  const initialAyah = searchParams.get('ayah') ? parseInt(searchParams.get('ayah')!) : undefined;

  // Reading timer
  const timer = useReadingTimer();

  // Track current ayah position
  const currentAyahRef = useRef(0);
  const handleAyahChange = useCallback((ayah: number) => {
    currentAyahRef.current = Math.max(currentAyahRef.current, ayah);
  }, []);

  // Session dialog state
  const [sessionDialog, setSessionDialog] = useState<{
    open: boolean;
    surahName: string;
    juzNumber: number | null;
    durationMinutes: number;
    durationSeconds: number;
    totalAyahs: number;
    lastAyahPosition: number;
  }>({ open: false, surahName: '', juzNumber: null, durationMinutes: 0, durationSeconds: 0, totalAyahs: 0, lastAyahPosition: 0 });

  // Get surah data for timer
  const { data: surahData } = useQuranSurah(activeSurah);

  // Start timer when surah data loads
  useEffect(() => {
    if (surahData && activeSurah) {
      const juz = surahData.verses[0]?.juz ?? null;
      timer.start(surahData.surah.englishName, juz);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surahData?.surah.number]);

  // Stop timer and maybe prompt
  const stopAndPrompt = useCallback(() => {
    const result = timer.stop();
    if (result && result.durationSeconds >= MIN_SESSION_SECONDS) {
      setSessionDialog({
        open: true,
        surahName: result.surahName,
        juzNumber: result.juzNumber,
        durationMinutes: result.durationMinutes,
        durationSeconds: result.durationSeconds,
        totalAyahs: currentAyahRef.current || (surahData?.surah.numberOfAyahs ?? 0),
        lastAyahPosition: currentAyahRef.current,
      });
    }
    currentAyahRef.current = 0;
  }, [timer, surahData]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    stopAndPrompt();
    setSearchParams({});
  }, [stopAndPrompt, setSearchParams]);

  // Listen for navigation events from the viewer (prev/next surah)
  useEffect(() => {
    const handler = (e: Event) => {
      const num = (e as CustomEvent).detail;
      // Stop timer for current surah and prompt if long enough
      stopAndPrompt();
      setSearchParams({ surah: String(num) });
    };
    window.addEventListener('quran-navigate', handler);
    return () => window.removeEventListener('quran-navigate', handler);
  }, [setSearchParams, stopAndPrompt]);

  // Prompt on unmount if reading
  useEffect(() => {
    return () => {
      // Can't show dialog on unmount, but reset timer
      timer.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = preferences?.enabled && preferences?.quran_enabled;

  if (prefsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="container mx-auto py-6">
        <Card className="glass-card border-0 rounded-xl">
          <CardContent className="p-12 text-center space-y-4">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.quran.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.quran.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/spiritual/quran')} className="shrink-0">
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <BookOpen className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t('spiritual.quranReader.title', 'Read the Qur\'an')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('spiritual.quranReader.subtitle', 'Read the Holy Qur\'an with English translation')}
          </p>
        </div>
      </div>

      <Card className="glass-card border-0 rounded-xl">
        <CardContent className="p-4 md:p-6">
          {surahsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : activeSurah ? (
            <SurahViewer
              surahNumber={activeSurah}
              onBack={handleBack}
              onStopAndSave={stopAndPrompt}
              elapsedSeconds={timer.elapsedSeconds}
              formatTime={timer.formatTime}
              initialAyah={initialAyah}
              onAyahChange={handleAyahChange}
            />
          ) : (
            <SurahList
              surahs={surahs}
              onSelect={(n) => setSearchParams({ surah: String(n) })}
              search={search}
              setSearch={setSearch}
            />
          )}
        </CardContent>
      </Card>

      {/* Session save dialog */}
      <ReadingSessionDialog
        open={sessionDialog.open}
        onOpenChange={(open) => setSessionDialog((prev) => ({ ...prev, open }))}
        surahName={sessionDialog.surahName}
        juzNumber={sessionDialog.juzNumber}
        durationMinutes={sessionDialog.durationMinutes}
        durationSeconds={sessionDialog.durationSeconds}
        totalAyahs={sessionDialog.totalAyahs}
        lastAyahPosition={sessionDialog.lastAyahPosition}
      />
    </div>
  );
}


