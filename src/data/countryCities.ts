export interface City {
  en: string;
  ar: string;
}

export interface Country {
  code: string;
  en: string;
  ar: string;
  cities: City[];
}

export const COUNTRIES: Country[] = [
  {
    code: 'SA', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية',
    cities: [
      { en: 'Riyadh', ar: 'الرياض' },
      { en: 'Jeddah', ar: 'جدة' },
      { en: 'Makkah', ar: 'مكة المكرمة' },
      { en: 'Madinah', ar: 'المدينة المنورة' },
      { en: 'Dammam', ar: 'الدمام' },
      { en: 'Khobar', ar: 'الخبر' },
      { en: 'Dhahran', ar: 'الظهران' },
      { en: 'Tabuk', ar: 'تبوك' },
      { en: 'Abha', ar: 'أبها' },
      { en: 'Taif', ar: 'الطائف' },
      { en: 'Hail', ar: 'حائل' },
      { en: 'Jazan', ar: 'جازان' },
      { en: 'Najran', ar: 'نجران' },
      { en: 'Buraidah', ar: 'بريدة' },
      { en: 'Yanbu', ar: 'ينبع' },
      { en: 'Al Jubail', ar: 'الجبيل' },
      { en: 'Al Kharj', ar: 'الخرج' },
      { en: 'Arar', ar: 'عرعر' },
      { en: 'Sakaka', ar: 'سكاكا' },
      { en: 'Al Baha', ar: 'الباحة' },
    ],
  },
  {
    code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة',
    cities: [
      { en: 'Abu Dhabi', ar: 'أبو ظبي' },
      { en: 'Dubai', ar: 'دبي' },
      { en: 'Sharjah', ar: 'الشارقة' },
      { en: 'Ajman', ar: 'عجمان' },
      { en: 'Al Ain', ar: 'العين' },
      { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
      { en: 'Fujairah', ar: 'الفجيرة' },
    ],
  },
  {
    code: 'BH', en: 'Bahrain', ar: 'البحرين',
    cities: [
      { en: 'Manama', ar: 'المنامة' },
      { en: 'Riffa', ar: 'الرفاع' },
      { en: 'Muharraq', ar: 'المحرق' },
    ],
  },
  {
    code: 'KW', en: 'Kuwait', ar: 'الكويت',
    cities: [
      { en: 'Kuwait City', ar: 'مدينة الكويت' },
      { en: 'Hawalli', ar: 'حولي' },
      { en: 'Salmiya', ar: 'السالمية' },
      { en: 'Jahra', ar: 'الجهراء' },
    ],
  },
  {
    code: 'OM', en: 'Oman', ar: 'عُمان',
    cities: [
      { en: 'Muscat', ar: 'مسقط' },
      { en: 'Salalah', ar: 'صلالة' },
      { en: 'Sohar', ar: 'صحار' },
      { en: 'Nizwa', ar: 'نزوى' },
    ],
  },
  {
    code: 'QA', en: 'Qatar', ar: 'قطر',
    cities: [
      { en: 'Doha', ar: 'الدوحة' },
      { en: 'Al Wakrah', ar: 'الوكرة' },
      { en: 'Al Khor', ar: 'الخور' },
    ],
  },
  {
    code: 'EG', en: 'Egypt', ar: 'مصر',
    cities: [
      { en: 'Cairo', ar: 'القاهرة' },
      { en: 'Alexandria', ar: 'الإسكندرية' },
      { en: 'Giza', ar: 'الجيزة' },
      { en: 'Luxor', ar: 'الأقصر' },
      { en: 'Aswan', ar: 'أسوان' },
    ],
  },
  {
    code: 'JO', en: 'Jordan', ar: 'الأردن',
    cities: [
      { en: 'Amman', ar: 'عمّان' },
      { en: 'Irbid', ar: 'إربد' },
      { en: 'Zarqa', ar: 'الزرقاء' },
      { en: 'Aqaba', ar: 'العقبة' },
    ],
  },
  {
    code: 'IQ', en: 'Iraq', ar: 'العراق',
    cities: [
      { en: 'Baghdad', ar: 'بغداد' },
      { en: 'Basra', ar: 'البصرة' },
      { en: 'Erbil', ar: 'أربيل' },
      { en: 'Mosul', ar: 'الموصل' },
      { en: 'Najaf', ar: 'النجف' },
    ],
  },
  {
    code: 'LB', en: 'Lebanon', ar: 'لبنان',
    cities: [
      { en: 'Beirut', ar: 'بيروت' },
      { en: 'Tripoli', ar: 'طرابلس' },
      { en: 'Sidon', ar: 'صيدا' },
    ],
  },
  {
    code: 'PS', en: 'Palestine', ar: 'فلسطين',
    cities: [
      { en: 'Jerusalem', ar: 'القدس' },
      { en: 'Gaza', ar: 'غزة' },
      { en: 'Ramallah', ar: 'رام الله' },
      { en: 'Hebron', ar: 'الخليل' },
      { en: 'Nablus', ar: 'نابلس' },
    ],
  },
  {
    code: 'SY', en: 'Syria', ar: 'سوريا',
    cities: [
      { en: 'Damascus', ar: 'دمشق' },
      { en: 'Aleppo', ar: 'حلب' },
      { en: 'Homs', ar: 'حمص' },
      { en: 'Latakia', ar: 'اللاذقية' },
    ],
  },
  {
    code: 'YE', en: 'Yemen', ar: 'اليمن',
    cities: [
      { en: "Sana'a", ar: 'صنعاء' },
      { en: 'Aden', ar: 'عدن' },
      { en: 'Taiz', ar: 'تعز' },
    ],
  },
  {
    code: 'SD', en: 'Sudan', ar: 'السودان',
    cities: [
      { en: 'Khartoum', ar: 'الخرطوم' },
      { en: 'Omdurman', ar: 'أم درمان' },
      { en: 'Port Sudan', ar: 'بورتسودان' },
    ],
  },
  {
    code: 'LY', en: 'Libya', ar: 'ليبيا',
    cities: [
      { en: 'Tripoli', ar: 'طرابلس' },
      { en: 'Benghazi', ar: 'بنغازي' },
      { en: 'Misrata', ar: 'مصراتة' },
    ],
  },
  {
    code: 'TN', en: 'Tunisia', ar: 'تونس',
    cities: [
      { en: 'Tunis', ar: 'تونس العاصمة' },
      { en: 'Sfax', ar: 'صفاقس' },
      { en: 'Sousse', ar: 'سوسة' },
    ],
  },
  {
    code: 'DZ', en: 'Algeria', ar: 'الجزائر',
    cities: [
      { en: 'Algiers', ar: 'الجزائر العاصمة' },
      { en: 'Oran', ar: 'وهران' },
      { en: 'Constantine', ar: 'قسنطينة' },
    ],
  },
  {
    code: 'MA', en: 'Morocco', ar: 'المغرب',
    cities: [
      { en: 'Casablanca', ar: 'الدار البيضاء' },
      { en: 'Rabat', ar: 'الرباط' },
      { en: 'Marrakech', ar: 'مراكش' },
      { en: 'Fes', ar: 'فاس' },
      { en: 'Tangier', ar: 'طنجة' },
    ],
  },
  {
    code: 'TR', en: 'Turkey', ar: 'تركيا',
    cities: [
      { en: 'Istanbul', ar: 'إسطنبول' },
      { en: 'Ankara', ar: 'أنقرة' },
      { en: 'Izmir', ar: 'إزمير' },
      { en: 'Bursa', ar: 'بورصة' },
      { en: 'Antalya', ar: 'أنطاليا' },
    ],
  },
  {
    code: 'PK', en: 'Pakistan', ar: 'باكستان',
    cities: [
      { en: 'Islamabad', ar: 'إسلام أباد' },
      { en: 'Karachi', ar: 'كراتشي' },
      { en: 'Lahore', ar: 'لاهور' },
      { en: 'Faisalabad', ar: 'فيصل أباد' },
      { en: 'Rawalpindi', ar: 'راولبندي' },
    ],
  },
  {
    code: 'MY', en: 'Malaysia', ar: 'ماليزيا',
    cities: [
      { en: 'Kuala Lumpur', ar: 'كوالالمبور' },
      { en: 'George Town', ar: 'جورج تاون' },
      { en: 'Johor Bahru', ar: 'جوهر بارو' },
      { en: 'Kota Kinabalu', ar: 'كوتا كينابالو' },
    ],
  },
  {
    code: 'ID', en: 'Indonesia', ar: 'إندونيسيا',
    cities: [
      { en: 'Jakarta', ar: 'جاكرتا' },
      { en: 'Surabaya', ar: 'سورابايا' },
      { en: 'Bandung', ar: 'باندونغ' },
      { en: 'Medan', ar: 'ميدان' },
      { en: 'Yogyakarta', ar: 'يوغياكارتا' },
    ],
  },
  {
    code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة',
    cities: [
      { en: 'London', ar: 'لندن' },
      { en: 'Birmingham', ar: 'برمنغهام' },
      { en: 'Manchester', ar: 'مانشستر' },
      { en: 'Leeds', ar: 'ليدز' },
      { en: 'Edinburgh', ar: 'إدنبرة' },
    ],
  },
  {
    code: 'US', en: 'United States', ar: 'الولايات المتحدة',
    cities: [
      { en: 'New York', ar: 'نيويورك' },
      { en: 'Los Angeles', ar: 'لوس أنجلوس' },
      { en: 'Chicago', ar: 'شيكاغو' },
      { en: 'Houston', ar: 'هيوستن' },
      { en: 'Washington', ar: 'واشنطن' },
      { en: 'Detroit', ar: 'ديترويت' },
    ],
  },
  {
    code: 'CA', en: 'Canada', ar: 'كندا',
    cities: [
      { en: 'Toronto', ar: 'تورنتو' },
      { en: 'Montreal', ar: 'مونتريال' },
      { en: 'Vancouver', ar: 'فانكوفر' },
      { en: 'Ottawa', ar: 'أوتاوا' },
      { en: 'Calgary', ar: 'كالغاري' },
    ],
  },
  {
    code: 'DE', en: 'Germany', ar: 'ألمانيا',
    cities: [
      { en: 'Berlin', ar: 'برلين' },
      { en: 'Munich', ar: 'ميونخ' },
      { en: 'Frankfurt', ar: 'فرانكفورت' },
      { en: 'Hamburg', ar: 'هامبورغ' },
      { en: 'Cologne', ar: 'كولونيا' },
    ],
  },
  {
    code: 'FR', en: 'France', ar: 'فرنسا',
    cities: [
      { en: 'Paris', ar: 'باريس' },
      { en: 'Marseille', ar: 'مرسيليا' },
      { en: 'Lyon', ar: 'ليون' },
      { en: 'Toulouse', ar: 'تولوز' },
      { en: 'Strasbourg', ar: 'ستراسبورغ' },
    ],
  },
];

/** Get cities for a given country code */
export function getCitiesForCountry(countryCode: string): City[] {
  return COUNTRIES.find((c) => c.code === countryCode)?.cities ?? [];
}
