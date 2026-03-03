import { useQuery } from '@tanstack/react-query';

export interface QuranVerse {
  number: number;
  numberInSurah: number;
  text: string;
  translation?: string;
  juz: number;
  page: number;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export function useQuranSurahList() {
  return useQuery<SurahMeta[]>({
    queryKey: ['quran-surah-list'],
    queryFn: async () => {
      const res = await fetch('https://api.alquran.cloud/v1/surah');
      if (!res.ok) throw new Error('Failed to fetch surah list');
      const json = await res.json();
      return json.data;
    },
    staleTime: Infinity,
  });
}

export function useQuranSurah(surahNumber: number | null) {
  return useQuery<{ surah: SurahMeta; verses: QuranVerse[] }>({
    queryKey: ['quran-surah', surahNumber],
    queryFn: async () => {
      if (!surahNumber) throw new Error('No surah');
      // Fetch Arabic + English translation in parallel
      const [arRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.sahih`),
      ]);
      if (!arRes.ok || !enRes.ok) throw new Error('Failed to fetch surah');
      const [arJson, enJson] = await Promise.all([arRes.json(), enRes.json()]);

      const arData = arJson.data;
      const enData = enJson.data;

      const verses: QuranVerse[] = arData.ayahs.map((ayah: any, i: number) => ({
        number: ayah.number,
        numberInSurah: ayah.numberInSurah,
        text: ayah.text,
        translation: enData.ayahs[i]?.text ?? '',
        juz: ayah.juz,
        page: ayah.page,
      }));

      return {
        surah: {
          number: arData.number,
          name: arData.name,
          englishName: arData.englishName,
          englishNameTranslation: arData.englishNameTranslation,
          numberOfAyahs: arData.numberOfAyahs,
          revelationType: arData.revelationType,
        },
        verses,
      };
    },
    enabled: !!surahNumber,
    staleTime: Infinity,
  });
}
