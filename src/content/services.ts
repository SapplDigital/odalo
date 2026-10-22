/**
 * Services. Stable `id` values drive routes (/services/{id}), form selections,
 * analytics and tile positions — rename the visible `name` freely, never the id.
 * DEMO CONTENT: final service wording is an outstanding input (handoff doc 06).
 */
import type { L, LList } from '../i18n';
import { projectById, type ProjectImage } from './projects';

export type ServiceId = 'web' | 'local' | 'video' | 'ads';

/**
 * Which existing concept output stands for a service. The picture is a ProjectImage of a concept project (`projectId` + `imageId`),
 * or `crop`: a record for a crop exported only for the service tiles (source in docs/review/services-mosaic/).
 * The project's own badge is the visible concept label; `label` is the short caption beside it; alt text comes from the picture's record.
 */
export interface ServiceVisual {
  projectId: string;
  imageId?: string;
  crop?: ProjectImage;
  /** object-position inside the tile's picture box (the box changes shape between layouts; the picture is never stretched). */
  position: string;
  /** `cover` crops to the picture box; `contain` shows the whole picture (used for the square creative, whose headline must never be cut). */
  fit?: 'cover' | 'contain';
  /** While this tile is the narrow neighbour of an active tile (its box becomes nearly square or portrait), the picture eases to this position and magnification,
   *  in step with the moving edge, so the crop shows the picture's subject and never a stray fragment of text. A uniform scale: nothing is stretched. */
  positionNarrow?: string;
  /** Position at the tablet layout, where the picture boxes are nearly square. */
  positionTablet?: string;
  /** Picture box shape in the single-column phone layout (CSS aspect-ratio); default 16 / 10. */
  ratioMobile?: string;
  zoomNarrow?: number;
  label: L;
}

export interface Service {
  id: ServiceId;
  number: string;
  name: L;
  outcome: L;
  detail: L;
  deliverables: LList;
  relatedPlan: 'base' | 'local' | 'captacion' | '360';
  /** The concept picture shown on the service's tile and page. See `ServiceVisual`. */
  visual: ServiceVisual;
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
    visual: { projectId: 'sample-hotel', imageId: 'hotel-desktop', position: '62% 22%', positionTablet: '34% 22%', positionNarrow: '100% 22%', zoomNarrow: 1.35, label: { es: 'Casa Almina, pantalla web', en: 'Casa Almina, website screen', de: 'Casa Almina, Webseite' } },
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
      de: ['Lokale SEO', 'Bewertungs­management', 'Google-Beiträge', 'Monatlicher Bericht'],
    },
    relatedPlan: 'local',
    visual: {
      projectId: 'sample-clinic', position: '12% 35%', positionNarrow: '8% 35%', ratioMobile: '5 / 4',
      label: { es: 'Tidewell, sección de información local', en: 'Tidewell, local-information section', de: 'Tidewell, Abschnitt mit lokalen Infos' },
      crop: {
        id: 'services-local-info', role: 'screen', folder: 'services', file: 'services-local-info', widths: [640, 1024, 1440], width: 1440, height: 590, screenshotLang: 'en',
        alt: {
          es: 'Sección «Five minutes from the market» de la página de destino de la consulta ficticia Tidewell: una ilustración de la calle con la consulta, una panadería y la parada del autobús 12, junto a dirección, cómo llegar, accesos y horario.',
          en: 'The "Five minutes from the market" section of the fictional Tidewell practice destination page: an illustration of the street with the practice, a bakery and the number 12 bus stop, beside address, directions, access and opening hours.',
          de: 'Der Abschnitt „Five minutes from the market“ der Zielseite der fiktiven Praxis Tidewell: eine Illustration der Straße mit der Praxis, einer Bäckerei und der Bushaltestelle der Linie 12, daneben Adresse, Anfahrt, Zugang und Öffnungszeiten.',
        },
        caption: {
          es: 'Sección de información local de la página de destino de concepto: dirección, cómo llegar, accesos y horario (texto de la imagen en inglés).',
          en: 'The local-information section of the concept destination page: address, directions, access and hours (picture text in English).',
          de: 'Der Abschnitt mit lokalen Informationen der Konzept-Zielseite: Adresse, Anfahrt, Zugang und Zeiten (Bildtext auf Englisch).',
        },
        provenance: {
          es: 'Recorte de la sección #find-us de la página de destino del concepto Tidewell (docs/review/concept-clinic/index.html), a 1440 px, sin el relleno vacío de arriba y abajo (1440 por 590 px). Ilustración vectorial original, sin fotografías ni listados reales. La consulta es ficticia.',
          en: 'Crop of the #find-us section of the Tidewell concept destination page (docs/review/concept-clinic/index.html) at 1440 px, trimmed of empty padding above and below (1440 by 590 px). Original vector illustration; no photographs and no real listing. The practice is fictional.',
          de: 'Ausschnitt des Abschnitts #find-us der Tidewell-Konzept-Zielseite (docs/review/concept-clinic/index.html) bei 1440 px, ohne den leeren Rand oben und unten (1440 mal 590 px). Originale Vektorillustration; keine Fotos und kein echter Eintrag. Die Praxis ist fiktiv.',
        },
      },
    },
    faqIds: ['concept-work', 'plan-includes', 'audit-includes'],
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
      de: 'Von monatlichen Reels bis zu Aufnahme­sessions: Inhalte werden gemeinsam mit Website und Anzeigen geplant.',
    },
    deliverables: {
      es: ['Dos reels al mes (plan Captación)', 'Una sesión de grabación al mes (plan 360)', 'Doce publicaciones al mes (plan 360)'],
      en: ['Two reels per month (Captación plan)', 'One recording session per month (360 plan)', 'Twelve posts per month (360 plan)'],
      de: ['Zwei Reels pro Monat (Paket Captación)', 'Eine Aufnahme­session pro Monat (Paket 360)', 'Zwölf Beiträge pro Monat (Paket 360)'],
    },
    relatedPlan: 'captacion',
    visual: {
      projectId: 'sample-shop', position: '50% 50%',
      label: { es: 'Brindle Pantry, fotogramas de la pieza en movimiento', en: 'Brindle Pantry, frames from the motion piece', de: 'Brindle Pantry, Einzelbilder aus dem Bewegtbild' },
      crop: {
        id: 'services-video-strip', role: 'screen', folder: 'services', file: 'services-video-strip', widths: [640, 1280, 2000], width: 2000, height: 800, screenshotLang: 'en',
        alt: {
          es: 'Tira de cinco fotogramas de la pieza en movimiento de la campaña ficticia Brindle Pantry: ingredientes que caen con «Small batches.», los productos envasados en una estantería y el escaparate de la tienda con el horario.',
          en: 'A strip of five frames from the motion piece of the fictional Brindle Pantry campaign: ingredients dropping in under "Small batches.", the packaged products on a shelf and the shop window with opening hours.',
          de: 'Ein Streifen aus fünf Einzelbildern des Bewegtbilds der fiktiven Kampagne Brindle Pantry: hereinfallende Zutaten unter „Small batches.“, die verpackten Produkte im Regal und das Schaufenster mit Öffnungszeiten.',
        },
        caption: {
          es: 'Cinco fotogramas del vídeo de concepto de 10 segundos, sin sonido (texto de la imagen en inglés). El vídeo completo está en el estudio de caso.',
          en: 'Five frames from the 10-second silent concept video (picture text in English). The full video is in the case study.',
          de: 'Fünf Einzelbilder aus dem zehnsekündigen Konzeptvideo ohne Ton (Bildtext auf Englisch). Das ganze Video steht in der Fallstudie.',
        },
        provenance: {
          es: 'Fotogramas reales extraídos con ffmpeg del MP4 de concepto Brindle Pantry (public/work/concepts/shop) en 0,8, 3,2, 5,6, 7,6 y 9,4 s, sobre una tira de película dibujada. Ilustración y animación originales, no imágenes filmadas.',
          en: 'Real frames extracted with ffmpeg from the Brindle Pantry concept MP4 (public/work/concepts/shop) at 0.8, 3.2, 5.6, 7.6 and 9.4 s, on a drawn film strip. Original illustration and animation, not filmed footage.',
          de: 'Echte Einzelbilder, mit ffmpeg aus dem Brindle-Pantry-Konzept-MP4 (public/work/concepts/shop) bei 0,8, 3,2, 5,6, 7,6 und 9,4 s entnommen, auf einem gezeichneten Filmstreifen. Originale Illustration und Animation, kein gefilmtes Material.',
        },
      },
    },
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
    visual: { projectId: 'sample-clinic', imageId: 'clinic-ad-square', position: '50% 50%', fit: 'contain', ratioMobile: '5 / 4', label: { es: 'Tidewell, creatividad cuadrada', en: 'Tidewell, square ad concept', de: 'Tidewell, quadratischer Anzeigenentwurf' } },
    faqIds: ['ad-spend', 'plan-includes', 'audit-includes'],
    relatedProjects: ['sample-shop', 'sample-clinic'],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

/** The picture, concept label and caption for a service (tile and service page), resolved from the concept projects. */
export function serviceVisual(s: Service) {
  const v = s.visual;
  const project = projectById(v.projectId)!;
  const image = v.crop ?? project.images!.find((i) => i.id === v.imageId)!;
  return { image, badge: project.badge!, label: v.label, position: v.position, fit: v.fit ?? 'cover', positionNarrow: v.positionNarrow ?? v.position, positionTablet: v.positionTablet ?? v.position, ratioMobile: v.ratioMobile ?? '16 / 10', zoomNarrow: v.zoomNarrow ?? 1 };
}
