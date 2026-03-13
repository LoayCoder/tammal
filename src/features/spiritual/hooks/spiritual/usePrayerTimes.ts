import { useQuery } from '@tanstack/react-query';

export interface PrayerTimings {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise: string;
  Sunset: string;
}

interface AladhanResponse {
  code: number;
  data: {
    timings: PrayerTimings;
    date: {
      readable: string;
      hijri: {
        date: string;
        month: { en: string; ar: string; number: number };
        year: string;
        day: string;
      };
    };
  };
}

export const CALCULATION_METHODS = [
  { id: 1, name: 'University of Islamic Sciences, Karachi', nameAr: 'جامعة العلوم الإسلامية، كراتشي' },
  { id: 2, name: 'Islamic Society of North America (ISNA)', nameAr: 'الجمعية الإسلامية لأمريكا الشمالية' },
  { id: 3, name: 'Muslim World League', nameAr: 'رابطة العالم الإسلامي' },
  { id: 4, name: 'Umm al-Qura University, Makkah', nameAr: 'جامعة أم القرى، مكة' },
  { id: 5, name: 'Egyptian General Authority of Survey', nameAr: 'الهيئة المصرية العامة للمساحة' },
  { id: 7, name: 'Institute of Geophysics, University of Tehran', nameAr: 'معهد الجيوفيزياء، جامعة طهران' },
  { id: 8, name: 'Gulf Region', nameAr: 'منطقة الخليج' },
  { id: 9, name: 'Kuwait', nameAr: 'الكويت' },
  { id: 10, name: 'Qatar', nameAr: 'قطر' },
  { id: 11, name: 'Majlis Ugama Islam Singapura', nameAr: 'مجلس الشؤون الإسلامية سنغافورة' },
  { id: 12, name: 'Union des Organisations Islamiques de France', nameAr: 'اتحاد المنظمات الإسلامية في فرنسا' },
  { id: 13, name: 'Diyanet İşleri Başkanlığı, Turkey', nameAr: 'رئاسة الشؤون الدينية التركية' },
];

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
export type PrayerName = typeof PRAYER_NAMES[number];

export function usePrayerTimes(city?: string | null, country?: string | null, method: number = 4) {
  return useQuery({
    queryKey: ['prayer-times', city, country, method],
    queryFn: async (): Promise<AladhanResponse['data'] | null> => {
      if (!city || !country) return null;
      const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch prayer times');
      const json: AladhanResponse = await res.json();
      return json.data;
    },
    enabled: !!city && !!country,
    staleTime: 1000 * 60 * 60, // cache 1 hour
    gcTime: 1000 * 60 * 60 * 24, // keep in cache 24h
  });
}
