/**
 * Plans and inclusions. Prices come from ./offer.ts (approved offer: monthly Base/Local/Captación, 360 on custom quote, website build from a one-off price).
 * Tax wording, revisions, installments, minimum term and the precise 360 scope are NOT agreed yet.
 * Stable ids (`base`, `local`, `captacion`, `360`) are used by ?plan= on the audit form.
 */
import { formatPrice, type L, type LList, type Lang } from '../i18n';
import { monthlyPrice, websiteBuildFrom } from './offer';

export type PlanId = 'base' | 'local' | 'captacion' | '360';

export interface Plan {
  id: PlanId;
  name: string;
  monthly: number | null; // EUR per month; null = no fixed public price (custom quote)
  featured: boolean;
  builtOn: PlanId | null;
  own: LList; // inclusions this plan adds
  notIncluded: LList;
}

export const plans: Plan[] = [
  {
    id: 'base', name: 'Base', monthly: monthlyPrice.base, featured: false, builtOn: null,
    own: {
      es: ['Alojamiento', 'Mantenimiento', 'Copias de seguridad', '30 min de cambios', 'Ficha de Google básica'],
      en: ['Hosting', 'Maintenance', 'Backups', '30 min of changes', 'Basic Google business profile'],
      de: ['Hosting', 'Wartung', 'Sicherungen', '30 Min. Änderungen', 'Einfaches Google-Unternehmensprofil'],
    },
    notIncluded: {
      es: ['SEO local y reseñas', 'Publicidad', 'Vídeo y contenido'],
      en: ['Local SEO and reviews', 'Advertising', 'Video and content'],
      de: ['Lokale SEO und Bewertungen', 'Werbung', 'Video und Content'],
    },
  },
  {
    id: 'local', name: 'Local', monthly: monthlyPrice.local, featured: false, builtOn: 'base',
    own: {
      es: ['SEO local completo', 'Gestión de reseñas', 'Publicaciones en Google', 'Informe mensual'],
      en: ['Full local SEO', 'Review management', 'Google posts', 'Monthly report'],
      de: ['Vollständige lokale SEO', 'Bewertungs­management', 'Google-Beiträge', 'Monatlicher Bericht'],
    },
    notIncluded: {
      es: ['Publicidad', 'Vídeo y contenido'],
      en: ['Advertising', 'Video and content'],
      de: ['Werbung', 'Video und Content'],
    },
  },
  {
    id: 'captacion', name: 'Captación', monthly: monthlyPrice.captacion, featured: true, builtOn: 'local',
    own: {
      es: ['Un canal de anuncios (Google o Meta)', '2 reels al mes con tu material grabado', 'Panel de resultados'],
      en: ['One ad channel (Google or Meta)', '2 reels per month from your footage', 'Results dashboard'],
      de: ['Ein Werbekanal (Google oder Meta)', '2 Reels pro Monat aus deinem Material', 'Ergebnis-Dashboard'],
    },
    notIncluded: {
      es: ['Inversión en anuncios (se paga a Google o Meta)', 'Segundo canal de anuncios', 'Grabación y desplazamientos (extra)'],
      en: ['Ad spend (paid to Google or Meta)', 'Second ad channel', 'Filming and travel (extra)'],
      de: ['Werbebudget (zahlst du an Google oder Meta)', 'Zweiter Werbekanal', 'Dreh und Anreise (extra)'],
    },
  },
  {
    id: '360', name: '360', monthly: monthlyPrice['360'], featured: false, builtOn: 'captacion',
    own: {
      es: ['Alcance a medida: canales de anuncios, producción de contenido, publicaciones e idiomas, con presupuesto para tu negocio'],
      en: ['Scope built for your business and quoted: ad channels, content production, posts and languages'],
      de: ['Umfang für dein Unternehmen zusammengestellt und angeboten: Werbekanäle, Content-Produktion, Beiträge und Sprachen'],
    },
    notIncluded: {
      es: ['Inversión en anuncios (se paga a Google o Meta)'],
      en: ['Ad spend (paid to Google or Meta)'],
      de: ['Werbebudget (zahlst du an Google oder Meta)'],
    },
  },
];

/** What to show for a plan's price: a formatted monthly amount, or the custom-quote label (360). Never a number for a null price. */
export const quoteLabel: L = { es: 'Presupuesto a medida', en: 'Custom quote', de: 'Individuelles Angebot' };
export function planPriceText(p: Plan, lang: Lang, perMonth: string): string {
  return p.monthly === null ? quoteLabel[lang] : `${formatPrice(p.monthly, lang)}${perMonth}`;
}
export const buildFromPrice = (lang: Lang) => formatPrice(websiteBuildFrom, lang);

export const planById = (id: string) => plans.find((p) => p.id === id);
export const planIds = plans.map((p) => p.id);

/** Every plan that includes a service whose lowest (entry) plan is `entry`: a plan contains everything of the plans it is `builtOn`, so the
 *  list follows the catalogue above (entry base -> all four; local -> Local, Captación, 360; captacion -> Captación, 360). */
export function plansFrom(entry: PlanId): Plan[] {
  return plans.filter((p) => { for (let c: Plan | undefined = p; c; c = c.builtOn ? planById(c.builtOn) : undefined) if (c.id === entry) return true; return false; });
}

/** Comparison table. A value is `true`, `false`, or a localized string such as "2 per month". */
type Cell = boolean | L;
export interface Feature { id: string; label: L; values: Record<PlanId, Cell> }

const all = (v: Cell): Record<PlanId, Cell> => ({ base: v, local: v, captacion: v, '360': v });
const fromLocal = (v: Cell): Record<PlanId, Cell> => ({ base: false, local: v, captacion: v, '360': v });

export const features: Feature[] = [
  { id: 'hosting', label: { es: 'Alojamiento, mantenimiento y copias', en: 'Hosting, maintenance and backups', de: 'Hosting, Wartung und Sicherungen' }, values: all(true) },
  { id: 'changes', label: { es: 'Cambios en la web', en: 'Website changes', de: 'Änderungen an der Website' }, values: all({ es: '30 min', en: '30 min', de: '30 Min.' }) },
  { id: 'gbp', label: { es: 'Ficha de Google', en: 'Google business profile', de: 'Google-Unternehmensprofil' }, values: { base: { es: 'Básica', en: 'Basic', de: 'Einfach' }, local: true, captacion: true, '360': true } },
  { id: 'seo', label: { es: 'SEO local', en: 'Local SEO', de: 'Lokale SEO' }, values: fromLocal(true) },
  { id: 'reviews', label: { es: 'Gestión de reseñas', en: 'Review management', de: 'Bewertungs­management' }, values: fromLocal(true) },
  { id: 'posts', label: { es: 'Publicaciones en Google', en: 'Google posts', de: 'Google-Beiträge' }, values: fromLocal(true) },
  { id: 'report', label: { es: 'Informe mensual', en: 'Monthly report', de: 'Monatlicher Bericht' }, values: fromLocal(true) },
  { id: 'channels', label: { es: 'Canales de anuncios', en: 'Ad channels', de: 'Werbekanäle' }, values: { base: false, local: false, captacion: { es: '1 (Google o Meta)', en: '1 (Google or Meta)', de: '1 (Google oder Meta)' }, '360': { es: 'A medida', en: 'Quoted', de: 'Nach Angebot' } } },
  { id: 'reels', label: { es: 'Reels al mes', en: 'Reels per month', de: 'Reels pro Monat' }, values: { base: false, local: false, captacion: { es: '2 (tu material)', en: '2 (your footage)', de: '2 (dein Material)' }, '360': { es: 'A medida', en: 'Quoted', de: 'Nach Angebot' } } },
  { id: 'dashboard', label: { es: 'Panel de resultados', en: 'Results dashboard', de: 'Ergebnis-Dashboard' }, values: { base: false, local: false, captacion: true, '360': true } },
];

/** Open commercial questions from the handoff (doc 05). Shown as "to be confirmed", never as commitments. */
export const pendingConditions: LList = {
  es: ['Importe exacto de la creación de la web (se confirma antes del presupuesto)', 'Compromiso mínimo y cancelación', 'Propiedad de la web y de los materiales creativos', 'Límite de revisiones', 'Lugar y desplazamientos del rodaje', 'Titularidad de las cuentas publicitarias', 'Medidas exactas de los informes', 'Plazos de producción', 'Entregables multilingües por plan'],
  en: ['Exact website build amount (confirmed before the quote)', 'Minimum commitment and cancellation', 'Ownership of websites and creative assets', 'Revision limits', 'Filming location and travel', 'Advertising-account ownership', 'Exact reporting measures', 'Production timelines', 'Multilingual deliverables by plan'],
  de: ['Genauer Betrag der Website-Erstellung (vor dem Angebot bestätigt)', 'Mindestlaufzeit und Kündigung', 'Eigentum an Websites und kreativen Materialien', 'Anzahl der Korrekturschleifen', 'Drehort und Anreise', 'Inhaberschaft der Werbekonten', 'Genaue Berichtskennzahlen', 'Produktionszeiträume', 'Mehrsprachige Lieferungen je Paket'],
};
