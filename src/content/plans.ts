/**
 * Plans, prices and inclusions. DEMO CONTENT, taken from the reference plans.
 * Prices, tax wording and inclusions need business confirmation before launch.
 * Stable ids (`base`, `local`, `captacion`, `360`) are used by ?plan= on the audit form.
 */
import type { L, LList } from '../i18n';

export type PlanId = 'base' | 'local' | 'captacion' | '360';

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // EUR per month, example price
  featured: boolean;
  builtOn: PlanId | null;
  own: LList; // inclusions this plan adds
  notIncluded: LList;
}

export const plans: Plan[] = [
  {
    id: 'base', name: 'Base', price: 59, featured: false, builtOn: null,
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
    id: 'local', name: 'Local', price: 290, featured: false, builtOn: 'base',
    own: {
      es: ['SEO local completo', 'Gestión de reseñas', 'Publicaciones en Google', 'Informe mensual'],
      en: ['Full local SEO', 'Review management', 'Google posts', 'Monthly report'],
      de: ['Vollständige lokale SEO', 'Bewertungsmanagement', 'Google-Beiträge', 'Monatlicher Bericht'],
    },
    notIncluded: {
      es: ['Publicidad', 'Vídeo y contenido'],
      en: ['Advertising', 'Video and content'],
      de: ['Werbung', 'Video und Content'],
    },
  },
  {
    id: 'captacion', name: 'Captación', price: 590, featured: true, builtOn: 'local',
    own: {
      es: ['Un canal de anuncios (Google o Meta)', '2 reels al mes', 'Panel de resultados'],
      en: ['One ad channel (Google or Meta)', '2 reels per month', 'Results dashboard'],
      de: ['Ein Werbekanal (Google oder Meta)', '2 Reels pro Monat', 'Ergebnis-Dashboard'],
    },
    notIncluded: {
      es: ['Inversión en anuncios (se paga a Google o Meta)', 'Segundo canal de anuncios', 'Sesiones de grabación'],
      en: ['Ad spend (paid to Google or Meta)', 'Second ad channel', 'Recording sessions'],
      de: ['Werbebudget (zahlst du an Google oder Meta)', 'Zweiter Werbekanal', 'Aufnahmesessions'],
    },
  },
  {
    id: '360', name: '360', price: 1290, featured: false, builtOn: 'captacion',
    own: {
      es: ['Dos canales de anuncios', 'Una sesión de grabación al mes', '12 publicaciones', 'SEO en 2–3 idiomas'],
      en: ['Two ad channels', 'One recording session per month', '12 posts', 'SEO in 2–3 languages'],
      de: ['Zwei Werbekanäle', 'Eine Aufnahmesession pro Monat', '12 Beiträge', 'SEO in 2–3 Sprachen'],
    },
    notIncluded: {
      es: ['Inversión en anuncios (se paga a Google o Meta)'],
      en: ['Ad spend (paid to Google or Meta)'],
      de: ['Werbebudget (zahlst du an Google oder Meta)'],
    },
  },
];

export const planById = (id: string) => plans.find((p) => p.id === id);
export const planIds = plans.map((p) => p.id);

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
  { id: 'reviews', label: { es: 'Gestión de reseñas', en: 'Review management', de: 'Bewertungsmanagement' }, values: fromLocal(true) },
  { id: 'posts', label: { es: 'Publicaciones en Google', en: 'Google posts', de: 'Google-Beiträge' }, values: fromLocal(true) },
  { id: 'report', label: { es: 'Informe mensual', en: 'Monthly report', de: 'Monatlicher Bericht' }, values: fromLocal(true) },
  { id: 'channels', label: { es: 'Canales de anuncios', en: 'Ad channels', de: 'Werbekanäle' }, values: { base: false, local: false, captacion: { es: '1 (Google o Meta)', en: '1 (Google or Meta)', de: '1 (Google oder Meta)' }, '360': { es: '2', en: '2', de: '2' } } },
  { id: 'reels', label: { es: 'Reels al mes', en: 'Reels per month', de: 'Reels pro Monat' }, values: { base: false, local: false, captacion: { es: '2', en: '2', de: '2' }, '360': { es: '2', en: '2', de: '2' } } },
  { id: 'dashboard', label: { es: 'Panel de resultados', en: 'Results dashboard', de: 'Ergebnis-Dashboard' }, values: { base: false, local: false, captacion: true, '360': true } },
  { id: 'recording', label: { es: 'Sesión de grabación al mes', en: 'Recording session per month', de: 'Aufnahmesession pro Monat' }, values: { base: false, local: false, captacion: false, '360': { es: '1', en: '1', de: '1' } } },
  { id: 'socialposts', label: { es: 'Publicaciones al mes', en: 'Posts per month', de: 'Beiträge pro Monat' }, values: { base: false, local: false, captacion: false, '360': { es: '12', en: '12', de: '12' } } },
  { id: 'multilang', label: { es: 'SEO en varios idiomas', en: 'Multilingual SEO', de: 'Mehrsprachige SEO' }, values: { base: false, local: false, captacion: false, '360': { es: '2–3 idiomas', en: '2–3 languages', de: '2–3 Sprachen' } } },
];

/** Open commercial questions from the handoff (doc 05). Shown as "to be confirmed", never as commitments. */
export const pendingConditions: LList = {
  es: ['Cuotas iniciales de diseño o puesta en marcha', 'Compromiso mínimo y cancelación', 'Propiedad de la web y de los materiales creativos', 'Límite de revisiones', 'Lugar y desplazamientos de las sesiones de grabación', 'Titularidad de las cuentas publicitarias', 'Medidas exactas de los informes', 'Plazos de producción', 'Entregables multilingües por plan'],
  en: ['Initial design or setup fees', 'Minimum commitment and cancellation', 'Ownership of websites and creative assets', 'Revision limits', 'Recording-session location and travel', 'Advertising-account ownership', 'Exact reporting measures', 'Production timelines', 'Multilingual deliverables by plan'],
  de: ['Einmalige Design- oder Einrichtungsgebühren', 'Mindestlaufzeit und Kündigung', 'Eigentum an Websites und kreativen Materialien', 'Anzahl der Korrekturschleifen', 'Ort und Anreise bei Aufnahmesessions', 'Inhaberschaft der Werbekonten', 'Genaue Berichtskennzahlen', 'Produktionszeiträume', 'Mehrsprachige Lieferungen je Paket'],
};
