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

/** Same text as formatPrice, split at the number so a very large price may wrap between currency symbol and digits (never inside the digits). */
export function priceParts(amount: number, lang: Lang): { lead: string; num: string; trail: string } {
  const parts = new Intl.NumberFormat(languageNames[lang].locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).formatToParts(amount);
  const isNum = (t: string) => t === 'integer' || t === 'group' || t === 'decimal' || t === 'fraction';
  const first = parts.findIndex((x) => isNum(x.type));
  const last = parts.length - 1 - [...parts].reverse().findIndex((x) => isNum(x.type));
  const join = (a: number, b: number) => parts.slice(a, b).map((x) => x.value).join('');
  // a space between number and symbol stays with the number, so it never starts a wrapped line
  return { lead: join(0, first), num: join(first, last + 1) + (parts[last + 1]?.type === 'literal' ? parts[last + 1].value : ''), trail: join(parts[last + 1]?.type === 'literal' ? last + 2 : last + 1, parts.length) };
}

export function formatDate(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(languageNames[lang].locale, { dateStyle: 'long' }).format(d);
}
