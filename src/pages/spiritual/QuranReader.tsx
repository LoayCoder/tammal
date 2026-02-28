import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpenCheck, Clock, TrendingUp, Plus, BookOpen } from 'lucide-react';
import { useSpiritualPreferences } from '@/hooks/spiritual/useSpiritualPreferences';
import { useQuranSessions } from '@/hooks/spiritual/useQuranSessions';
import { useNavigate } from 'react-router-dom';

const SURAHS = [
  'Al-Fatiha','Al-Baqarah','Aal-Imran','An-Nisa','Al-Maidah','Al-Anam','Al-Araf','Al-Anfal',
  'At-Tawbah','Yunus','Hud','Yusuf','Ar-Ra\'d','Ibrahim','Al-Hijr','An-Nahl','Al-Isra',
  'Al-Kahf','Maryam','Ta-Ha','Al-Anbiya','Al-Hajj','Al-Mu\'minun','An-Nur','Al-Furqan',
  'Ash-Shu\'ara','An-Naml','Al-Qasas','Al-Ankabut','Ar-Rum','Luqman','As-Sajdah',
  'Al-Ahzab','Saba','Fatir','Ya-Sin','As-Saffat','Sad','Az-Zumar','Ghafir',
  'Fussilat','Ash-Shura','Az-Zukhruf','Ad-Dukhan','Al-Jathiyah','Al-Ahqaf','Muhammad',
  'Al-Fath','Al-Hujurat','Qaf','Adh-Dhariyat','At-Tur','An-Najm','Al-Qamar','Ar-Rahman',
  'Al-Waqi\'ah','Al-Hadid','Al-Mujadila','Al-Hashr','Al-Mumtahanah','As-Saff','Al-Jumu\'ah',
  'Al-Munafiqun','At-Taghabun','At-Talaq','At-Tahrim','Al-Mulk','Al-Qalam','Al-Haqqah',
  'Al-Ma\'arij','Nuh','Al-Jinn','Al-Muzzammil','Al-Muddaththir','Al-Qiyamah','Al-Insan',
  'Al-Mursalat','An-Naba','An-Nazi\'at','Abasa','At-Takwir','Al-Infitar','Al-Mutaffifin',
  'Al-Inshiqaq','Al-Buruj','At-Tariq','Al-A\'la','Al-Ghashiyah','Al-Fajr','Al-Balad',
  'Ash-Shams','Al-Layl','Ad-Duha','Ash-Sharh','At-Tin','Al-Alaq','Al-Qadr','Al-Bayyinah',
  'Az-Zalzalah','Al-Adiyat','Al-Qari\'ah','At-Takathur','Al-Asr','Al-Humazah','Al-Fil',
  'Quraysh','Al-Ma\'un','Al-Kawthar','Al-Kafirun','An-Nasr','Al-Masad','Al-Ikhlas',
  'Al-Falaq','An-Nas'
];

export default function QuranReader() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { preferences, isPending: prefsLoading } = useSpiritualPreferences();

  const isActive = preferences?.enabled && preferences?.quran_enabled;

  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, []);
  const today = new Date().toISOString().split('T')[0];

  const { sessions, isPending: isLoading, logSession, totalMinutes, totalSessions } = useQuranSessions({ from: weekAgo, to: today });

  // Form state
  const [duration, setDuration] = useState('15');
  const [surah, setSurah] = useState('');
  const [juz, setJuz] = useState('');
  const [reflection, setReflection] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = () => {
    logSession.mutate({
      duration_minutes: parseInt(duration) || 15,
      surah_name: surah || undefined,
      juz_number: juz ? parseInt(juz) : undefined,
      reflection_notes: reflection || undefined,
    });
    setShowForm(false);
    setDuration('15');
    setSurah('');
    setJuz('');
    setReflection('');
  };

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
            <BookOpenCheck className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t('spiritual.quran.notEnabled')}</h2>
            <p className="text-muted-foreground">{t('spiritual.quran.enablePrompt')}</p>
            <Button onClick={() => navigate('/settings/profile')}>{t('spiritual.prayer.goToSettings')}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpenCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">{t('spiritual.quran.title')}</h1>
            <p className="text-muted-foreground">{t('spiritual.quran.subtitle')}</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('spiritual.quran.logSession')}
        </Button>
      </div>

      {/* Weekly stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">{t('spiritual.quran.sessionsThisWeek')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMinutes}</p>
              <p className="text-xs text-muted-foreground">{t('spiritual.quran.minutesThisWeek')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-stat border-0 rounded-xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0}</p>
              <p className="text-xs text-muted-foreground">{t('spiritual.quran.avgMinutes')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Log form */}
      {showForm && (
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg">{t('spiritual.quran.newSession')}</CardTitle>
            <CardDescription>{t('spiritual.quran.newSessionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('spiritual.quran.duration')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="240"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('spiritual.quran.surah')}</Label>
                <Select value={surah} onValueChange={setSurah}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('spiritual.quran.selectSurah')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {SURAHS.map((s, i) => (
                      <SelectItem key={i} value={s}>{`${i + 1}. ${s}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('spiritual.quran.juz')}</Label>
                <Select value={juz} onValueChange={setJuz}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('spiritual.quran.selectJuz')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 30 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{`${t('spiritual.quran.juzLabel')} ${i + 1}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('spiritual.quran.reflection')}</Label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t('spiritual.quran.reflectionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSubmit} disabled={logSession.isPending}>
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session history */}
      <Card className="glass-card border-0 rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">{t('spiritual.quran.recentSessions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('spiritual.quran.noSessions')}</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {session.duration_minutes} {t('spiritual.quran.min')}
                      </Badge>
                      {session.surah_name && (
                        <Badge variant="outline">{session.surah_name}</Badge>
                      )}
                      {session.juz_number && (
                        <Badge variant="outline">{t('spiritual.quran.juzLabel')} {session.juz_number}</Badge>
                      )}
                    </div>
                    {session.reflection_notes && (
                      <p className="text-sm text-muted-foreground italic">"{session.reflection_notes}"</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ms-2">{session.session_date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Encouragement */}
      <p className="text-sm text-muted-foreground italic text-center">
        {totalMinutes >= 60
          ? t('spiritual.quran.feedback.excellent')
          : totalMinutes > 0
            ? t('spiritual.quran.feedback.good')
            : t('spiritual.quran.feedback.encouragement')
        }
      </p>
    </div>
  );
}
