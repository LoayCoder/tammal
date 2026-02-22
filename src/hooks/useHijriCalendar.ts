import { useQuery } from '@tanstack/react-query';

export interface HijriDateInfo {
  day: string;
  month: { en: string; ar: string; number: number };
  year: string;
  date: string; // DD-MM-YYYY
  designation: { abbreviated: string; expanded: string };
  holidays: string[];
}

export interface HijriMonthDay {
  gregorian: string; // YYYY-MM-DD
  hijri: HijriDateInfo;
}

// Known Islamic events mapped by Hijri month-day
export const ISLAMIC_EVENTS: Record<string, { en: string; ar: string; isFastingDay?: boolean }> = {
  '1-1': { en: 'Islamic New Year', ar: 'رأس السنة الهجرية' },
  '1-10': { en: 'Day of Ashura', ar: 'يوم عاشوراء', isFastingDay: true },
  '1-9': { en: 'Tasu\'a', ar: 'تاسوعاء', isFastingDay: true },
  '3-12': { en: 'Mawlid al-Nabi', ar: 'المولد النبوي' },
  '7-27': { en: 'Isra & Mi\'raj', ar: 'الإسراء والمعراج' },
  '8-15': { en: 'Mid-Sha\'ban', ar: 'ليلة النصف من شعبان' },
  '9-1': { en: 'Start of Ramadan', ar: 'بداية رمضان' },
  '9-27': { en: 'Laylat al-Qadr (est.)', ar: 'ليلة القدر (تقديرية)' },
  '10-1': { en: 'Eid al-Fitr', ar: 'عيد الفطر' },
  '10-2': { en: 'Eid al-Fitr (Day 2)', ar: 'عيد الفطر (اليوم الثاني)' },
  '10-3': { en: 'Eid al-Fitr (Day 3)', ar: 'عيد الفطر (اليوم الثالث)' },
  '12-8': { en: 'Day of Tarwiyah', ar: 'يوم التروية' },
  '12-9': { en: 'Day of Arafah', ar: 'يوم عرفة', isFastingDay: true },
  '12-10': { en: 'Eid al-Adha', ar: 'عيد الأضحى' },
  '12-11': { en: 'Eid al-Adha (Day 2)', ar: 'عيد الأضحى (اليوم الثاني)' },
  '12-12': { en: 'Eid al-Adha (Day 3)', ar: 'عيد الأضحى (اليوم الثالث)' },
  '12-13': { en: 'Eid al-Adha (Day 4)', ar: 'عيد الأضحى (اليوم الرابع)' },
};

// White Days (13-14-15 of every Hijri month) are recommended fasting days
export function isWhiteDay(hijriDay: number): boolean {
  return hijriDay >= 13 && hijriDay <= 15;
}

// Monday and Thursday are Sunnah fasting days
export function isSunnahFastingDay(gregorianDate: Date): boolean {
  const day = gregorianDate.getDay();
  return day === 1 || day === 4; // Monday=1, Thursday=4
}

interface AladhanCalendarResponse {
  code: number;
  data: Array<{
    date: {
      gregorian: { date: string; format: string; day: string; weekday: { en: string } };
      hijri: {
        date: string;
        day: string;
        month: { number: number; en: string; ar: string };
        year: string;
        designation: { abbreviated: string; expanded: string };
        holidays: string[];
      };
    };
  }>;
}

export function useHijriCalendar(month: number, year: number) {
  return useQuery({
    queryKey: ['hijri-calendar', month, year],
    queryFn: async (): Promise<HijriMonthDay[]> => {
      const url = `https://api.aladhan.com/v1/gpiritualToHijriCalendar/${month}/${year}`;
      // Use the simpler calendar endpoint
      const calUrl = `https://api.aladhan.com/v1/gpiritualToHijriCalendar/${month}/${year}`;
      
      // Actually use the Gregorian calendar endpoint which returns Hijri mapping
      const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
      if (!res.ok) throw new Error('Failed to fetch Hijri calendar');
      const json: AladhanCalendarResponse = await res.json();
      
      return json.data.map(day => ({
        gregorian: `${year}-${String(month).padStart(2, '0')}-${day.date.gregorian.day.padStart(2, '0')}`,
        hijri: {
          day: day.date.hijri.day,
          month: day.date.hijri.month,
          year: day.date.hijri.year,
          date: day.date.hijri.date,
          designation: day.date.hijri.designation,
          holidays: day.date.hijri.holidays,
        },
      }));
    },
    staleTime: 1000 * 60 * 60 * 24, // cache 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });
}

// Get today's Hijri date
export function useHijriToday() {
  return useQuery({
    queryKey: ['hijri-today'],
    queryFn: async (): Promise<HijriDateInfo> => {
      const res = await fetch('https://api.aladhan.com/v1/gToH');
      if (!res.ok) throw new Error('Failed to fetch Hijri date');
      const json = await res.json();
      const hijri = json.data.hijri;
      return {
        day: hijri.day,
        month: hijri.month,
        year: hijri.year,
        date: hijri.date,
        designation: hijri.designation,
        holidays: hijri.holidays || [],
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
