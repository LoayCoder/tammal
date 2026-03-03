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
export const ISLAMIC_EVENTS: Record<string, {
  en: string; ar: string;
  descEn?: string; descAr?: string;
  isFastingDay?: boolean;
}> = {
  // Muharram
  '1-1': { en: 'Islamic New Year', ar: 'رأس السنة الهجرية', descEn: 'Marks the beginning of the Hijri calendar year', descAr: 'بداية السنة الهجرية الجديدة' },
  '1-9': { en: 'Tasu\'a', ar: 'تاسوعاء', isFastingDay: true, descEn: 'Day before Ashura; recommended to fast', descAr: 'اليوم الذي يسبق عاشوراء، يُستحب صيامه' },
  '1-10': { en: 'Day of Ashura', ar: 'يوم عاشوراء', isFastingDay: true, descEn: 'Commemorates Prophet Musa\'s deliverance; recommended fasting', descAr: 'يوم نجّى الله فيه موسى عليه السلام، يُستحب صيامه' },
  // Safar
  '2-1': { en: 'First of Safar', ar: 'غرة شهر صفر', descEn: 'Beginning of the month of Safar', descAr: 'بداية شهر صفر' },
  // Rabi al-Awwal
  '3-12': { en: 'Mawlid al-Nabi', ar: 'المولد النبوي', descEn: 'Birthday of Prophet Muhammad ﷺ', descAr: 'ذكرى مولد النبي محمد ﷺ' },
  // Rajab
  '7-27': { en: 'Isra & Mi\'raj', ar: 'الإسراء والمعراج', descEn: 'Night Journey and Ascension of the Prophet ﷺ', descAr: 'رحلة الإسراء والمعراج للنبي ﷺ' },
  // Sha'ban
  '8-1': { en: 'Start of Sha\'ban', ar: 'بداية شهر شعبان', descEn: 'Month preceding Ramadan; increase good deeds', descAr: 'الشهر الذي يسبق رمضان، يُستحب الإكثار من الطاعات' },
  '8-15': { en: 'Mid-Sha\'ban', ar: 'ليلة النصف من شعبان', descEn: 'Night of forgiveness and blessings', descAr: 'ليلة المغفرة والبركات' },
  // Ramadan
  '9-1': { en: 'Start of Ramadan', ar: 'بداية رمضان', descEn: 'Beginning of the blessed month of fasting', descAr: 'بداية شهر الصيام المبارك' },
  '9-21': { en: 'Laylat al-Qadr (search)', ar: 'تحري ليلة القدر', descEn: 'Seek it in the odd nights of the last 10', descAr: 'تُلتمس في الليالي الوتر من العشر الأواخر' },
  '9-23': { en: 'Laylat al-Qadr (possible)', ar: 'ليلة القدر (محتملة)', descEn: 'Better than a thousand months (Quran 97:3)', descAr: 'خير من ألف شهر (القدر:٣)' },
  '9-25': { en: 'Laylat al-Qadr (possible)', ar: 'ليلة القدر (محتملة)', descEn: 'Better than a thousand months (Quran 97:3)', descAr: 'خير من ألف شهر (القدر:٣)' },
  '9-27': { en: 'Laylat al-Qadr (possible)', ar: 'ليلة القدر (محتملة)', descEn: 'Better than a thousand months (Quran 97:3)', descAr: 'خير من ألف شهر (القدر:٣)' },
  '9-29': { en: 'Laylat al-Qadr (possible)', ar: 'ليلة القدر (محتملة)', descEn: 'Better than a thousand months (Quran 97:3)', descAr: 'خير من ألف شهر (القدر:٣)' },
  // Shawwal
  '10-1': { en: 'Eid al-Fitr', ar: 'عيد الفطر', descEn: 'Celebration marking the end of Ramadan', descAr: 'عيد الفطر المبارك بعد صيام رمضان' },
  '10-2': { en: 'Eid al-Fitr (Day 2)', ar: 'عيد الفطر (اليوم الثاني)', descEn: 'Celebration marking the end of Ramadan', descAr: 'عيد الفطر المبارك' },
  '10-3': { en: 'Eid al-Fitr (Day 3)', ar: 'عيد الفطر (اليوم الثالث)', descEn: 'Celebration marking the end of Ramadan', descAr: 'عيد الفطر المبارك' },
  '10-4': { en: 'Shawwal Fasting', ar: 'صيام شوال', isFastingDay: true, descEn: 'Six days of Shawwal; equals a full year of fasting', descAr: 'صيام ستة من شوال كصيام الدهر' },
  '10-5': { en: 'Shawwal Fasting', ar: 'صيام شوال', isFastingDay: true, descEn: 'Six days of Shawwal; equals a full year of fasting', descAr: 'صيام ستة من شوال كصيام الدهر' },
  '10-6': { en: 'Shawwal Fasting', ar: 'صيام شوال', isFastingDay: true, descEn: 'Six days of Shawwal; equals a full year of fasting', descAr: 'صيام ستة من شوال كصيام الدهر' },
  '10-7': { en: 'Shawwal Fasting', ar: 'صيام شوال', isFastingDay: true, descEn: 'Six days of Shawwal; equals a full year of fasting', descAr: 'صيام ستة من شوال كصيام الدهر' },
  '10-8': { en: 'Shawwal Fasting', ar: 'صيام شوال', isFastingDay: true, descEn: 'Six days of Shawwal; equals a full year of fasting', descAr: 'صيام ستة من شوال كصيام الدهر' },
  '10-9': { en: 'Shawwal Fasting', ar: 'صيام شوال', isFastingDay: true, descEn: 'Six days of Shawwal; equals a full year of fasting', descAr: 'صيام ستة من شوال كصيام الدهر' },
  // Dhul Hijjah
  '12-1': { en: 'Start of Dhul Hijjah', ar: 'بداية ذي الحجة', descEn: 'First 10 days are the most blessed days of the year', descAr: 'أفضل أيام الدنيا العشر الأوائل من ذي الحجة' },
  '12-8': { en: 'Day of Tarwiyah', ar: 'يوم التروية', descEn: 'Pilgrims prepare for Hajj; fasting recommended', descAr: 'يوم تروية الحجاج، يُستحب صيامه', isFastingDay: true },
  '12-9': { en: 'Day of Arafah', ar: 'يوم عرفة', isFastingDay: true, descEn: 'Best day for du\'a; fasting expiates two years of sins', descAr: 'أفضل يوم للدعاء، صيامه يكفّر سنتين' },
  '12-10': { en: 'Eid al-Adha', ar: 'عيد الأضحى', descEn: 'Festival of Sacrifice; commemorates Prophet Ibrahim\'s devotion', descAr: 'عيد الأضحى المبارك، ذكرى فداء إبراهيم عليه السلام' },
  '12-11': { en: 'Eid al-Adha (Day 2)', ar: 'عيد الأضحى (اليوم الثاني)', descEn: 'Days of Tashreeq; eat, drink, and remember Allah', descAr: 'أيام التشريق، أيام أكل وشرب وذكر لله' },
  '12-12': { en: 'Eid al-Adha (Day 3)', ar: 'عيد الأضحى (اليوم الثالث)', descEn: 'Days of Tashreeq; eat, drink, and remember Allah', descAr: 'أيام التشريق' },
  '12-13': { en: 'Eid al-Adha (Day 4)', ar: 'عيد الأضحى (اليوم الرابع)', descEn: 'Last day of Tashreeq', descAr: 'آخر أيام التشريق' },
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

interface AladhanGregorian {
  date: string;
  format: string;
  day: string;
  weekday: { en: string };
  month: { number: number; en: string };
  year: string;
}

interface AladhanHijri {
  date: string;
  day: string;
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
  holidays: string[];
}

interface AladhanCalendarEntry {
  hijri?: AladhanHijri;
  gregorian?: AladhanGregorian;
  date?: {
    hijri: AladhanHijri;
    gregorian: AladhanGregorian;
  };
}

interface AladhanCalendarResponse {
  code: number;
  data: AladhanCalendarEntry[];
}

export function useHijriCalendar(month: number, year: number) {
  return useQuery({
    queryKey: ['hijri-calendar', month, year],
    queryFn: async (): Promise<HijriMonthDay[]> => {
      const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
      if (!res.ok) throw new Error('Failed to fetch Hijri calendar');
      const json: AladhanCalendarResponse = await res.json();
      
      return json.data
        .map(entry => {
          const hijri = entry.hijri || entry.date?.hijri;
          const greg = entry.gregorian || entry.date?.gregorian;
          if (!hijri || !greg) return null;
          
          const gYear = greg.year || String(year);
          const gMonth = String(greg.month?.number || month).padStart(2, '0');
          const gDay = (greg.day || '01').padStart(2, '0');
          
          return {
            gregorian: `${gYear}-${gMonth}-${gDay}`,
            hijri: {
              day: hijri.day,
              month: hijri.month,
              year: hijri.year,
              date: hijri.date,
              designation: hijri.designation,
              holidays: hijri.holidays || [],
            },
          };
        })
        .filter((d): d is HijriMonthDay => d !== null);
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
