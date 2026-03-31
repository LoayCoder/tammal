import { useTranslation } from 'react-i18next';
import { ar, enUS } from 'date-fns/locale';
import { format as dfFormat, formatDistanceToNow as dfDistanceToNow, type FormatOptions } from 'date-fns';

/**
 * Hook that provides locale-aware date formatting functions.
 * Automatically resolves the date-fns locale from the current i18n language.
 *
 * Usage:
 *   const { lformat, ldistance, locale, isRTL } = useLocaleFormat();
 *   lformat(new Date(), 'PPP')  // -> localized date string
 */
export function useLocaleFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'ar' ? ar : enUS;
  const isRTL = i18n.language === 'ar';

  const lformat = (
    date: Date | number,
    formatStr: string,
    options?: Omit<FormatOptions, 'locale'>,
  ): string => dfFormat(date, formatStr, { locale, ...options });

  const ldistance = (
    date: Date | number,
    options?: Omit<Parameters<typeof dfDistanceToNow>[1], 'locale'>,
  ): string => dfDistanceToNow(date, { locale, addSuffix: true, ...options });

  return { lformat, ldistance, locale, isRTL } as const;
}
