export const languages = ['es', 'en', 'de'] as const;
export type Lang = (typeof languages)[number];
export const defaultLang: Lang = 'en';

export const languageNames: Record<Lang, { native: string; label: Record<Lang, string>; locale: string }> = {
  es: { native: 'Español', label: { es: 'Español', en: 'Spanish', de: 'Spanisch' }, locale: 'es-ES' },
  en: { native: 'English', label: { es: 'Inglés', en: 'English', de: 'Englisch' }, locale: 'en-GB' },
  de: { native: 'Deutsch', label: { es: 'Alemán', en: 'German', de: 'Deutsch' }, locale: 'de-DE' },
};

/** A localized string. Every published record carries all three languages. */
export type L = Record<Lang, string>;
export type LList = Record<Lang, string[]>;

export const isLang = (v: unknown): v is Lang => languages.includes(v as Lang);

/** Prefix an internal path with base + language. `path` has no leading slash. */
export function href(lang: Lang, path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.replace(/^\/+/, '');
  return `${base}/${lang}/${clean}`;
}

export function formatPrice(amount: number, lang: Lang): string {
  return new Intl.NumberFormat(languageNames[lang].locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(languageNames[lang].locale, { dateStyle: 'long' }).format(d);
}
