import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get the locale string based on language code
 */
export function getLocale(lang: string): string {
  return lang === 'ar' ? 'ar-SA' : 'en-US';
}

/**
 * Format a number based on the current language
 */
export function formatNumber(value: number, lang: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getLocale(lang), options).format(value);
}

/**
 * Format currency based on the current language
 */
export function formatCurrency(value: number, lang: string, currency = 'USD'): string {
  return new Intl.NumberFormat(getLocale(lang), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date based on the current language
 */
export function formatDate(date: Date | string, lang: string, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(getLocale(lang), options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a date with time based on the current language
 */
export function formatDateTime(date: Date | string, lang: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(getLocale(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format time only based on the current language
 */
export function formatTime(date: Date | string, lang: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(getLocale(lang), {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}
