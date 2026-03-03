import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, ChevronRight, ChevronLeft, Search, ArrowUp } from 'lucide-react';
import { useQuranSurahList, useQuranSurah, SurahMeta } from '@/hooks/spiritual/useQuranText';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';

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
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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

function SurahViewer({ surahNumber, onBack }: { surahNumber: number; onBack: () => void }) {
  const { t } = useTranslation();
  const { data, isPending, isError } = useQuranSurah(surahNumber);
  const topRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    topRef.current?.scrollIntoView();
  }, [surahNumber]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
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
    <div className="space-y-4">
      <div ref={topRef} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>
        <div className="flex-1 min-w-0 text-center">
          <h2 className="text-xl font-bold">{surah.name}</h2>
          <p className="text-sm text-muted-foreground">
            {surah.englishName} — {surah.englishNameTranslation} • {surah.numberOfAyahs} ayahs
          </p>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={surah.number <= 1}
          onClick={() => onBack()}
          className="gap-1"
        >
          <ChevronLeft className="h-3 w-3 rtl:rotate-180" />
          {t('spiritual.quranReader.prevSurah', 'Previous')}
        </Button>
        <Badge variant="secondary">
          {t('spiritual.quranReader.surahNum', 'Surah')} {surah.number}/114
        </Badge>
        <Button
          variant="outline"
          size="sm"
          disabled={surah.number >= 114}
          onClick={() => {
            // Navigate to next surah by updating parent state
            window.dispatchEvent(new CustomEvent('quran-navigate', { detail: surah.number + 1 }));
          }}
          className="gap-1"
        >
          {t('spiritual.quranReader.nextSurah', 'Next')}
          <ChevronRight className="h-3 w-3 rtl:rotate-180" />
        </Button>
      </div>

      {/* Bismillah */}
      {showBismillah && (
        <p className="text-center text-2xl font-arabic py-4 text-primary/80" dir="rtl">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}

      {/* Verses */}
      <div className="space-y-3">
        {verses.map((v) => (
          <Card key={v.numberInSurah} className="border rounded-lg overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-1">
                  {v.numberInSurah}
                </span>
                <p className="text-xl leading-loose font-arabic text-end flex-1" dir="rtl">
                  {v.text}
                </p>
              </div>
              {v.translation && (
                <p className="text-sm text-muted-foreground leading-relaxed ps-9">
                  {v.translation}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scroll to top */}
      <div className="flex justify-center py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => topRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="gap-2"
        >
          <ArrowUp className="h-4 w-4" />
          {t('spiritual.quranReader.backToTop', 'Back to top')}
        </Button>
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

  // Listen for navigation events from the viewer
  useEffect(() => {
    const handler = (e: Event) => {
      const num = (e as CustomEvent).detail;
      setSearchParams({ surah: String(num) });
    };
    window.addEventListener('quran-navigate', handler);
    return () => window.removeEventListener('quran-navigate', handler);
  }, [setSearchParams]);

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
              onBack={() => setSearchParams({})}
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
    </div>
  );
}
