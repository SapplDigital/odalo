/**
 * Services. Stable `id` values drive routes (/services/{id}), form selections,
 * analytics and tile positions — rename the visible `name` freely, never the id.
 * DEMO CONTENT: final service wording is an outstanding input (handoff doc 06).
 */
import type { L, LList } from '../i18n';

export type ServiceId = 'web' | 'local' | 'video' | 'ads';

export interface Service {
  id: ServiceId;
  number: string;
  name: L;
  outcome: L;
  detail: L;
  deliverables: LList;
  relatedPlan: 'base' | 'local' | 'captacion' | '360';
  /** Geometric artwork variant, see components/Art.astro. Replace with a photo via `image` later. */
  art: 'browser' | 'pin' | 'video' | 'chart';
  faqIds: string[];
  relatedProjects: string[];
}

export const services: Service[] = [
  {
    id: 'web',
    number: '01',
    name: { es: 'Web y mantenimiento', en: 'Websites and maintenance', de: 'Website und Wartung' },
    outcome: {
      es: 'Una presencia digital clara, rápida y cuidada, preparada para convertir visitas en consultas.',
      en: 'A clear, fast, well-kept web presence, ready to turn visits into enquiries.',
      de: 'Ein klarer, schneller und gepflegter Webauftritt, der Besuche in Anfragen verwandelt.',
    },
    detail: {
      es: 'Diseñamos y cuidamos tu web para que explique con claridad lo que haces y facilite que alguien te escriba o te llame.',
      en: 'We design and look after your website so it explains clearly what you do and makes it easy for someone to write or call.',
      de: 'Wir gestalten und pflegen deine Website, damit sie klar erklärt, was du tust, und es leicht macht, dich zu kontaktieren.',
    },
    deliverables: {
      es: ['Alojamiento y mantenimiento', 'Copias de seguridad', '30 minutos de cambios al mes', 'Ficha de Google básica'],
      en: ['Hosting and maintenance', 'Backups', '30 minutes of changes per month', 'Basic Google business profile'],
      de: ['Hosting und Wartung', 'Sicherungen', '30 Minuten Änderungen pro Monat', 'Einfaches Google-Unternehmensprofil'],
    },
    relatedPlan: 'base',
    art: 'browser',
    faqIds: ['one-service', 'existing-website', 'plan-includes'],
    relatedProjects: ['sample-hotel', 'sample-clinic'],
  },
  {
    id: 'local',
    number: '02',
    name: { es: 'Visibilidad local', en: 'Local visibility', de: 'Lokale Sichtbarkeit' },
    outcome: {
      es: 'Ayudamos a que tu negocio aparezca cuando alguien busca lo que ofreces cerca de ti.',
      en: 'We help your business appear when someone searches for what you offer nearby.',
      de: 'Wir helfen dir, gefunden zu werden, wenn jemand in der Nähe nach deinem Angebot sucht.',
    },
    detail: {
      es: 'Trabajamos tu presencia en búsquedas y mapas para cualquier mercado donde tengas clientes, no solo en una región concreta.',
      en: 'We work on your presence in search and maps for any market where you have customers, not just one region.',
      de: 'Wir arbeiten an deiner Präsenz in Suche und Karten, für jeden Markt, in dem du Kunden hast, nicht nur in einer Region.',
    },
    deliverables: {
      es: ['SEO local', 'Gestión de reseñas', 'Publicaciones en Google', 'Informe mensual'],
      en: ['Local SEO', 'Review management', 'Google posts', 'Monthly report'],
      de: ['Lokale SEO', 'Bewertungsmanagement', 'Google-Beiträge', 'Monatlicher Bericht'],
    },
    relatedPlan: 'local',
    art: 'pin',
    faqIds: ['international', 'plan-includes', 'audit-includes'],
    relatedProjects: ['sample-clinic', 'sample-hotel'],
  },
  {
    id: 'video',
    number: '03',
    name: { es: 'Vídeo y contenido', en: 'Video and content', de: 'Video und Content' },
    outcome: {
      es: 'Mostramos lo que haces con contenido que explica, conecta y da razones para elegirte.',
      en: 'We show what you do with content that explains, connects and gives people reasons to choose you.',
      de: 'Wir zeigen, was du tust, mit Inhalten, die erklären, verbinden und Gründe liefern, dich zu wählen.',
    },
    detail: {
      es: 'Desde reels mensuales hasta sesiones de grabación, el contenido se planifica junto a tu web y tus anuncios.',
      en: 'From monthly reels to recording sessions, content is planned together with your website and ads.',
      de: 'Von monatlichen Reels bis zu Aufnahmesessions: Inhalte werden gemeinsam mit Website und Anzeigen geplant.',
    },
    deliverables: {
      es: ['Dos reels al mes (plan Captación)', 'Una sesión de grabación al mes (plan 360)', 'Doce publicaciones al mes (plan 360)'],
      en: ['Two reels per month (Captación plan)', 'One recording session per month (360 plan)', 'Twelve posts per month (360 plan)'],
      de: ['Zwei Reels pro Monat (Paket Captación)', 'Eine Aufnahmesession pro Monat (Paket 360)', 'Zwölf Beiträge pro Monat (Paket 360)'],
    },
    relatedPlan: 'captacion',
    art: 'video',
    faqIds: ['one-service', 'plan-includes', 'change-plan'],
    relatedProjects: ['sample-shop', 'sample-hotel'],
  },
  {
    id: 'ads',
    number: '04',
    name: { es: 'Publicidad digital', en: 'Paid advertising', de: 'Online-Werbung' },
    outcome: {
      es: 'Campañas en Google y Meta conectadas con objetivos y resultados que puedas entender.',
      en: 'Google and Meta campaigns tied to goals and results you can understand.',
      de: 'Kampagnen auf Google und Meta, verbunden mit Zielen und Ergebnissen, die du verstehst.',
    },
    detail: {
      es: 'Las campañas llevan a páginas pensadas para ellas y se miden en un panel de resultados claro.',
      en: 'Campaigns lead to pages built for them and are measured in a clear results dashboard.',
      de: 'Kampagnen führen auf passende Seiten und werden in einem klaren Ergebnis-Dashboard gemessen.',
    },
    deliverables: {
      es: ['Un canal de anuncios, Google o Meta (plan Captación)', 'Dos canales de anuncios (plan 360)', 'Panel de resultados', 'La inversión en anuncios se paga directamente a Google o Meta'],
      en: ['One ad channel, Google or Meta (Captación plan)', 'Two ad channels (360 plan)', 'Results dashboard', 'Ad spend is paid directly to Google or Meta'],
      de: ['Ein Werbekanal, Google oder Meta (Paket Captación)', 'Zwei Werbekanäle (Paket 360)', 'Ergebnis-Dashboard', 'Das Werbebudget zahlst du direkt an Google oder Meta'],
    },
    relatedPlan: 'captacion',
    art: 'chart',
    faqIds: ['ad-spend', 'plan-includes', 'audit-includes'],
    relatedProjects: ['sample-shop', 'sample-clinic'],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);
