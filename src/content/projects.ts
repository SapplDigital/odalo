/**
 * SAMPLE projects. These are illustrative scenarios, NOT real clients.
 * They carry no results, quotes or client names. Replace with verified work
 * (and set `sample: false`) before launch.
 */
import type { L, LList, Lang } from '../i18n';
import type { ServiceId } from './services';

/**
 * A silent exported video for a concept project. Files: public/work/concepts/<folder>/<file>.<ext>. Never autoplays and is not
 * downloaded on page load (preload="none"); the poster is a ProjectImage-like still. width/height reserve the box.
 */
export interface ProjectVideo {
  id: string;
  folder: string;
  file: string;
  formats: { ext: string; type: string; bytes: number }[];
  width: number;
  height: number;
  seconds: number;
  fps: number;
  poster: { file: string; width: number; height: number };
  /** Accessible name and full description of what happens (the video is silent, so this is the text equivalent). */
  label: L;
  caption: L;
  provenance: L;
}

/**
 * An optional picture set for a project (replaces the generic artwork where present).
 * `card-narrow` is a purpose-made crop of the phone view used on narrow cards (below 48em) instead of the desktop picture.
 * Files live in public/work/concepts/<folder>/<file>-<width>.webp. `width`/`height` are the intrinsic size of the LARGEST
 * file, so the browser reserves the right box before loading. Every record carries three-language alt text, a caption,
 * the language the screenshot itself is in, and its provenance. See docs/review/concept-hotel/ASSET-REGISTER.md.
 */
export interface ProjectImage {
  id: string;
  role: 'card' | 'card-narrow' | 'card-tall' | 'screen' | 'creative';
  /** For card variants: the media query under which this picture replaces the default one. */
  media?: string;
  folder: string;
  file: string;
  widths: number[];
  width: number;
  height: number;
  alt: L;
  caption: L;
  screenshotLang: Lang;
  provenance: L;
}

export interface Project {
  id: string;
  sample: boolean;
  services: ServiceId[];
  art: 'browser' | 'pin' | 'video' | 'chart';
  tone: 'ink' | 'sand' | 'coral' | 'slate';
  title: L;
  /** Short name for cards and links in lists; the full `title` stays the case-study heading and the accessible name. */
  cardTitle?: L;
  kind: L;
  context: L;
  challenge: L;
  connected: L;
  related: string;
  /** Replaces the generic "sample project" badge, e.g. for a clearly labelled concept. */
  badge?: L;
  /** True for unbuilt concept work: the case study then uses the brief / approach / produced wording and shows no outcomes. */
  concept?: boolean;
  images?: ProjectImage[];
  /** Short list of the screens actually designed (concept projects). */
  screens?: L;
  /** Concise status note shown under the case-study title (concept projects). Project-specific on purpose. */
  status?: L;
  /** Proposed, not produced: a short plan (concept projects). */
  plan?: LList;
  planTitle?: L;
  planNote?: L;
  /** Replaces the "Screens designed" heading for projects whose outputs are not screens. */
  outputsTitle?: L;
  videos?: ProjectVideo[];
}

export const projects: Project[] = [
  {
    id: 'sample-hotel', sample: true, services: ['web', 'local', 'video'], art: 'browser', tone: 'ink', related: 'sample-clinic',
    cardTitle: { es: 'Casa Almina', en: 'Casa Almina', de: 'Casa Almina' },
    title: { es: 'Concepto de web para un hotel boutique', en: 'Boutique hotel website concept', de: 'Website-Konzept für ein Boutique-Hotel' },
    kind: { es: 'Alojamiento', en: 'Hospitality', de: 'Gastgewerbe' },
    badge: { es: 'Concepto de hotel ficticio', en: 'Fictional hotel concept', de: 'Konzept für ein fiktives Hotel' },
    concept: true,
    status: {
      es: 'Diseño por iniciativa propia para un hotel ficticio, desarrollado como prototipo local y adaptable. No es un encargo de cliente ni el lanzamiento de un hotel, y no hay datos de cliente ni de rendimiento.',
      en: 'Self-initiated design for a fictional hotel, built as a local responsive prototype. It is not a client commission or a hotel launch, and there is no client or performance data.',
      de: 'Eigeninitiative für ein fiktives Hotel, umgesetzt als lokaler, responsiver Prototyp. Es ist weder ein Kundenauftrag noch ein Hotelstart, und es gibt keine Kunden- oder Leistungsdaten.',
    },
    context: {
      es: 'Encargo imaginado: un pequeño hotel ficticio junto al puerto, con ocho habitaciones, necesita una web que muestre las habitaciones y el patio y facilite pedir fechas.',
      en: 'An imagined brief: a small, fictional harbour hotel with eight rooms needs a website that shows the rooms and the courtyard and makes it easy to ask for dates.',
      de: 'Ein erdachter Auftrag: Ein kleines, fiktives Hafenhotel mit acht Zimmern braucht eine Website, die Zimmer und Innenhof zeigt und die Anfrage von Daten leicht macht.',
    },
    challenge: {
      es: 'Transmitir el lugar en pocos segundos, presentar tres tipos de habitación con claridad y ofrecer una única forma evidente de pedir fechas.',
      en: 'Convey the place in a few seconds, present three room types clearly and give guests one obvious way to request dates.',
      de: 'Den Ort in wenigen Sekunden vermitteln, drei Zimmertypen klar darstellen und Gästen einen eindeutigen Weg bieten, Daten anzufragen.',
    },
    connected: {
      es: 'Producido aquí: un prototipo de web local y adaptable (inicio, habitaciones, instalaciones y un formulario de fechas que no envía nada) con ilustraciones originales. Solo propuestos, no producidos: una ficha local y contenido en vídeo que apuntarían a la misma solicitud.',
      en: 'Produced here: a local, responsive website prototype (home page, rooms, facilities and a date request form that sends nothing) with original illustrations. Proposed only, not produced: a local search profile and video content that would point to the same request.',
      de: 'Hier erstellt: ein lokaler, responsiver Website-Prototyp (Startseite, Zimmer, Angebote und ein Datenformular, das nichts versendet) mit eigenen Illustrationen. Nur vorgeschlagen, nicht erstellt: ein lokales Profil und Videoinhalte, die auf dieselbe Anfrage verweisen würden.',
    },
    screens: {
      es: 'Inicio en ordenador y en móvil con titular y botón de fechas, presentación de tres habitaciones, patio y desayuno, y un formulario de fechas que no envía nada.',
      en: 'The home page on desktop and on a phone with headline and date button, a presentation of three rooms, the courtyard and breakfast, and a date request form that sends nothing.',
      de: 'Die Startseite am Desktop und am Smartphone mit Überschrift und Datenknopf, eine Darstellung von drei Zimmern, Innenhof und Frühstück sowie ein Datenformular, das nichts versendet.',
    },
    images: [
      {
        id: 'hotel-desktop', role: 'card', folder: 'hotel', file: 'hotel-desktop', widths: [640, 1024, 1440], width: 1440, height: 900, screenshotLang: 'en',
        alt: {
          es: 'Captura de la página de inicio del hotel ficticio Casa Almina: una casa encalada al atardecer con ventanas en arco iluminadas, el titular «Eight rooms above the harbour» y un botón para pedir fechas.',
          en: 'Screenshot of the home page of the fictional Casa Almina hotel: a whitewashed house at dusk with lit arched windows, the headline "Eight rooms above the harbour" and a button to request dates.',
          de: 'Screenshot der Startseite des fiktiven Hotels Casa Almina: ein weiß gekalktes Haus in der Dämmerung mit beleuchteten Bogenfenstern, der Überschrift „Eight rooms above the harbour“ und einem Knopf zur Datenanfrage.',
        },
        caption: {
          es: 'Inicio en ordenador: titular, ilustración de la casa y botón de solicitud de fechas.',
          en: 'Home page on a desktop screen: headline, illustration of the house and the date request button.',
          de: 'Startseite am Desktop: Überschrift, Illustration des Hauses und der Knopf für die Datenanfrage.',
        },
        provenance: {
          es: 'Ilustración vectorial original y maqueta hechas para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo.',
          en: 'Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images.',
          de: 'Originale Vektorillustration und Layout für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder.',
        },
      },
      {
        id: 'hotel-detail', role: 'screen', folder: 'hotel', file: 'hotel-detail', widths: [640, 960, 1280], width: 1280, height: 800, screenshotLang: 'en',
        alt: {
          es: 'Detalle de la sección de habitaciones: la Harbour Suite con cama de lino y ventana en arco sobre el mar, y dos habitaciones más pequeñas, la Garden Room y la Attic Room, con superficie, cama y tarifa de ejemplo.',
          en: 'Detail of the rooms section: the Harbour Suite with a linen bed and an arched window over the sea, and two smaller rooms, the Garden Room and the Attic Room, each with size, bed and a sample rate.',
          de: 'Ausschnitt des Zimmerbereichs: die Harbour Suite mit Leinenbett und Bogenfenster zum Meer sowie zwei kleinere Zimmer, Garden Room und Attic Room, jeweils mit Größe, Bett und Beispielpreis.',
        },
        caption: {
          es: 'Detalle de las habitaciones: una suite principal y dos habitaciones menores con datos y tarifa de ejemplo.',
          en: 'Rooms in detail: one lead suite and two smaller rooms with facts and a sample rate.',
          de: 'Die Zimmer im Detail: eine Hauptsuite und zwei kleinere Zimmer mit Angaben und Beispielpreis.',
        },
        provenance: {
          es: 'Ilustración vectorial original y maqueta hechas para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo.',
          en: 'Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images.',
          de: 'Originale Vektorillustration und Layout für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder.',
        },
      },
      {
        id: 'hotel-mobile', role: 'screen', folder: 'hotel', file: 'hotel-mobile', widths: [390, 780], width: 780, height: 2600, screenshotLang: 'en',
        alt: {
          es: 'Captura móvil de la página de inicio de Casa Almina: el logotipo y un botón «Request dates» en la cabecera, el titular «Eight rooms above the harbour», dos botones, la casa ilustrada y el comienzo de la sección de habitaciones.',
          en: 'Phone screenshot of the Casa Almina home page: the logo and a "Request dates" button in the header, the headline "Eight rooms above the harbour", two buttons, the illustrated house and the start of the rooms section.',
          de: 'Smartphone-Screenshot der Startseite von Casa Almina: Logo und Knopf „Request dates“ in der Kopfzeile, die Überschrift „Eight rooms above the harbour“, zwei Knöpfe, das illustrierte Haus und der Beginn des Zimmerbereichs.',
        },
        caption: {
          es: 'En el móvil: cabecera con el botón de fechas, titular, la casa ilustrada y el inicio de las habitaciones.',
          en: 'On a phone: the header with the date button, the headline, the illustrated house and the start of the rooms.',
          de: 'Am Smartphone: Kopfzeile mit dem Datenknopf, Überschrift, das illustrierte Haus und der Beginn der Zimmer.',
        },
        provenance: {
          es: 'Ilustración vectorial original y maqueta hechas para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo.',
          en: 'Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images.',
          de: 'Originale Vektorillustration und Layout für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder.',
        },
      },
      {
        id: 'hotel-card-narrow', role: 'card-narrow', media: '(max-width: 47.99em)', folder: 'hotel', file: 'hotel-card-narrow', widths: [390, 780], width: 780, height: 1360, screenshotLang: 'en',
        alt: {
          es: 'Captura de la página de inicio del hotel ficticio Casa Almina: una casa encalada al atardecer con ventanas en arco iluminadas, el titular «Eight rooms above the harbour» y un botón para pedir fechas.',
          en: 'Screenshot of the home page of the fictional Casa Almina hotel: a whitewashed house at dusk with lit arched windows, the headline "Eight rooms above the harbour" and a button to request dates.',
          de: 'Screenshot der Startseite des fiktiven Hotels Casa Almina: ein weiß gekalktes Haus in der Dämmerung mit beleuchteten Bogenfenstern, der Überschrift „Eight rooms above the harbour“ und einem Knopf zur Datenanfrage.',
        },
        caption: {
          es: 'Recorte de la vista móvil: cabecera, titular y botones de la página de inicio.',
          en: 'Crop of the phone view: the home page header, headline and buttons.',
          de: 'Ausschnitt der Smartphone-Ansicht: Kopfzeile, Überschrift und Knöpfe der Startseite.',
        },
        provenance: {
          es: 'Ilustración vectorial original y maqueta hechas para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo.',
          en: 'Original vector illustration and layout made for this concept with AI assistance. No photographs and no stock images.',
          de: 'Originale Vektorillustration und Layout für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder.',
        },
      },
    ],
  },
  {
    id: 'sample-clinic', sample: true, services: ['local', 'ads'], art: 'pin', tone: 'sand', related: 'sample-shop',
    cardTitle: { es: 'Tidewell', en: 'Tidewell', de: 'Tidewell' },
    title: { es: 'Concepto de campaña local para una consulta de fisioterapia', en: 'Local campaign concept for a physiotherapy practice', de: 'Konzept für eine lokale Kampagne einer Physio­therapie­praxis' },
    kind: { es: 'Salud local', en: 'Local health', de: 'Lokale Gesundheit' },
    badge: { es: 'Concepto de consulta ficticia', en: 'Fictional practice concept', de: 'Konzept für eine fiktive Praxis' },
    concept: true,
    status: {
      es: 'Trabajo por iniciativa propia para una consulta ficticia: aquí se produjeron un prototipo local y dos diseños creativos. No hubo lanzamiento con un cliente real y no hay datos de cliente ni de rendimiento.',
      en: 'Self-initiated work for a fictional practice: a local prototype and two creative designs were produced here. There was no real client launch, and there is no client or performance data.',
      de: 'Eigeninitiative für eine fiktive Praxis: Hier entstanden ein lokaler Prototyp und zwei Kreativentwürfe. Es gab keinen echten Kundenstart, und es gibt keine Kunden- oder Leistungsdaten.',
    },
    context: {
      es: 'Encargo imaginado: una pequeña consulta de fisioterapia en un barrio ficticio depende de que la gente cercana la encuentre y se sienta cómoda al ponerse en contacto.',
      en: 'An imagined brief: a small physiotherapy practice in a fictional neighbourhood depends on people nearby finding it and feeling comfortable getting in touch.',
      de: 'Ein erdachter Auftrag: Eine kleine Physiotherapiepraxis in einem fiktiven Viertel ist darauf angewiesen, dass Menschen in der Nähe sie finden und sich wohl dabei fühlen, Kontakt aufzunehmen.',
    },
    challenge: {
      es: 'Hacer que la consulta sea fácil de entender y de encontrar: una sola página que explica los servicios con palabras sencillas, muestra dónde está y ofrece un único paso siguiente, con anuncios que llevan a ella.',
      en: 'Make the practice easy to understand and easy to reach: one page that explains the services in plain words, shows where the practice is and offers a single next step, with ads that lead to it.',
      de: 'Die Praxis leicht verständlich und leicht erreichbar machen: eine Seite, die die Leistungen in einfachen Worten erklärt, zeigt, wo die Praxis liegt, und einen einzigen nächsten Schritt anbietet, mit Anzeigen, die dorthin führen.',
    },
    connected: {
      es: 'Producido aquí: una página de destino local y adaptable (un prototipo que no envía nada), dos anuncios de concepto originales (cuadrado y vertical) y un plan escrito de presencia local. Solo propuestos, no producidos: crear un perfil de empresa local y poner en marcha la publicidad.',
      en: 'Produced here: a local, responsive campaign destination page (a prototype that submits nothing), two original concept ad creatives (square and portrait) and a written local-presence plan. Proposed only, not produced: setting up a local business profile and running the advertising.',
      de: 'Hier erstellt: eine lokale, responsive Zielseite für die Kampagne (ein Prototyp, der nichts sendet), zwei originale Konzeptanzeigen (quadratisch und hochformatig) und ein schriftlicher Plan für die lokale Präsenz. Nur vorgeschlagen, nicht erstellt: ein lokales Unternehmensprofil einrichten und die Werbung schalten.',
    },
    screens: {
      es: 'La página de destino en ordenador y en móvil: una introducción, una sección «dónde estamos» con dirección, acceso y horario, cuatro áreas de servicio y una solicitud de primera visita que no envía nada.',
      en: 'The destination page on desktop and on a phone: an introduction, a "find us" section with address, access and hours, four service areas and a first-visit enquiry that submits nothing.',
      de: 'Die Zielseite am Desktop und am Smartphone: eine Einführung, ein Abschnitt „So finden Sie uns“ mit Adresse, Zugang und Öffnungszeiten, vier Leistungsbereiche und eine Anfrage für einen ersten Besuch, die nichts sendet.',
    },
    plan: {
      es: [
        'Una sola fuente: el nombre, la dirección, el horario, el acceso y la lista de servicios se escriben una vez y se reutilizan en la página, en el perfil de empresa local y en los anuncios.',
        'Descripciones coherentes: cada servicio se describe con las mismas palabras sencillas donde aparezca, de modo que un resultado de búsqueda, un perfil y la página cuenten lo mismo.',
        'Un único destino de contacto: cada anuncio y cada enlace del perfil llevan a la misma página y a la misma solicitud de primera visita, que al principio solo pide un área y un momento preferido.',
        'Entrega, propuesta: la consulta confirma quién responde y con qué rapidez; los datos de salud quedan fuera de los anuncios, los formularios y el seguimiento.',
      ],
      en: [
        'One source of truth: the practice name, address, hours, access details and service list are written once and reused on the page, in the local business profile and in the ads.',
        'Matching descriptions: each service is described in the same plain words wherever it appears, so a search result, a profile and the page tell the same story.',
        'One enquiry destination: every ad and profile link points to the same page and the same first-visit enquiry, which at first asks only for an area and a preferred time.',
        'Delivery, proposed: the practice confirms who answers enquiries and how quickly; health details stay out of ads, forms and tracking.',
      ],
      de: [
        'Eine Quelle: Name, Adresse, Öffnungszeiten, Zugangsinfos und Leistungsliste werden einmal geschrieben und auf der Seite, im lokalen Unternehmensprofil und in den Anzeigen wiederverwendet.',
        'Übereinstimmende Beschreibungen: Jede Leistung wird überall in denselben einfachen Worten beschrieben, damit Suchergebnis, Profil und Seite dieselbe Geschichte erzählen.',
        'Ein Anfrageziel: Jede Anzeige und jeder Profillink führt zur selben Seite und zur selben Anfrage für einen ersten Besuch, die zunächst nur einen Bereich und eine Wunschzeit abfragt.',
        'Umsetzung, vorgeschlagen: Die Praxis legt fest, wer Anfragen beantwortet und wie schnell; Gesundheitsdaten bleiben aus Anzeigen, Formularen und Tracking heraus.',
      ],
    },
    images: [
      {
        id: 'clinic-card-wide', role: 'card', folder: 'clinic', file: 'clinic-card-wide', widths: [640, 960, 1280], width: 1280, height: 801, screenshotLang: 'en',
        alt: {
          es: 'Captura de la página de campaña de Tidewell Physiotherapy: el titular «Physiotherapy for everyday movement, in Millbrook», una breve introducción, un botón «Ask about a first visit» y una ilustración de una sala de tratamiento.',
          en: 'Screenshot of the Tidewell Physiotherapy campaign page: the headline "Physiotherapy for everyday movement, in Millbrook", a short introduction, an "Ask about a first visit" button and an illustrated treatment studio.',
          de: 'Screenshot der Kampagnenseite von Tidewell Physiotherapy: die Überschrift „Physiotherapy for everyday movement, in Millbrook“, eine kurze Einführung, ein Knopf „Ask about a first visit“ und die Illustration eines Behandlungsraums.',
        },
        caption: {
          es: 'La página de destino, parte superior.',
          en: 'The destination page, top section.',
          de: 'Die Zielseite, oberer Bereich.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, maquetas y textos originales hechos para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo. La consulta, su dirección y su web son ficticias.',
          en: 'Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional.',
          de: 'Originale Vektorillustrationen, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder. Praxis, Adresse und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'clinic-card-tall', role: 'card-tall', media: '(min-width: 80em)', folder: 'clinic', file: 'clinic-ad-portrait', widths: [540, 1080], width: 1080, height: 1350, screenshotLang: 'en',
        alt: {
          es: 'Anuncio vertical de concepto: las palabras «Back. Knees. Shoulders. Weekend sport.», una ilustración de una sala de tratamiento, la línea «Physiotherapy for everyday movement, in Millbrook», el botón «Ask about a first visit» y la etiqueta de creatividad de concepto.',
          en: 'Portrait concept ad: the words "Back. Knees. Shoulders. Weekend sport.", an illustration of a treatment studio, the line "Physiotherapy for everyday movement, in Millbrook", the "Ask about a first visit" button and the concept creative label.',
          de: 'Hochformatige Konzeptanzeige: die Worte „Back. Knees. Shoulders. Weekend sport.“, die Illustration eines Behandlungsraums, die Zeile „Physiotherapy for everyday movement, in Millbrook“, der Knopf „Ask about a first visit“ und die Kennzeichnung als Konzeptentwurf.',
        },
        caption: {
          es: 'Creatividad de concepto vertical.',
          en: 'Portrait concept creative.',
          de: 'Hochformatiger Konzeptentwurf.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, maquetas y textos originales hechos para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo. La consulta, su dirección y su web son ficticias.',
          en: 'Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional.',
          de: 'Originale Vektorillustrationen, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder. Praxis, Adresse und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'clinic-desktop', role: 'screen', folder: 'clinic', file: 'clinic-desktop', widths: [640, 1024, 1440], width: 1440, height: 900, screenshotLang: 'en',
        alt: {
          es: 'Captura a ancho completo de la página de Tidewell en un ordenador: navegación, titular, introducción, dos botones y una ilustración de una sala con personas haciendo ejercicios suaves.',
          en: 'Full-width screenshot of the Tidewell page on a desktop screen: navigation, headline, introduction, two buttons and a studio illustration with people doing gentle exercises.',
          de: 'Screenshot der Tidewell-Seite in voller Breite am Desktop: Navigation, Überschrift, Einführung, zwei Knöpfe und die Illustration eines Raums mit Menschen bei sanften Übungen.',
        },
        caption: {
          es: 'La página de destino en ordenador.',
          en: 'The destination page on desktop.',
          de: 'Die Zielseite am Desktop.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, maquetas y textos originales hechos para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo. La consulta, su dirección y su web son ficticias.',
          en: 'Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional.',
          de: 'Originale Vektorillustrationen, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder. Praxis, Adresse und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'clinic-mobile', role: 'screen', folder: 'clinic', file: 'clinic-mobile', widths: [390, 780], width: 780, height: 2224, screenshotLang: 'en',
        alt: {
          es: 'Captura móvil de la página: cabecera con un botón de solicitud, el titular, una introducción, dos botones, la ilustración de la sala y el comienzo de la sección «Five minutes from the market» con la ilustración de la calle.',
          en: 'Phone screenshot of the page: a header with an enquiry button, the headline, an introduction, two buttons, the studio illustration and the start of the "Five minutes from the market" section with the street illustration.',
          de: 'Smartphone-Screenshot der Seite: Kopfzeile mit einem Anfrageknopf, die Überschrift, eine Einführung, zwei Knöpfe, die Illustration des Raums und der Beginn des Abschnitts „Five minutes from the market“ mit der Straßenillustration.',
        },
        caption: {
          es: 'En el móvil: la introducción, las dos acciones y el comienzo de la sección local.',
          en: 'On a phone: the introduction, the two actions and the start of the local section.',
          de: 'Am Smartphone: die Einführung, die beiden Aktionen und der Beginn des lokalen Abschnitts.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, maquetas y textos originales hechos para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo. La consulta, su dirección y su web son ficticias.',
          en: 'Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional.',
          de: 'Originale Vektorillustrationen, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder. Praxis, Adresse und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'clinic-ad-square', role: 'creative', folder: 'clinic', file: 'clinic-ad-square', widths: [540, 1080], width: 1080, height: 1080, screenshotLang: 'en',
        alt: {
          es: 'Anuncio cuadrado de concepto: el titular «Physiotherapy, five minutes from Millbrook Market», una ilustración de la consulta en su calle, un botón «Ask about a first visit» y la dirección web tidewell.example/millbrook, marcado como creatividad de concepto de una consulta ficticia.',
          en: 'Square concept ad: the headline "Physiotherapy, five minutes from Millbrook Market", an illustration of the practice on its street, an "Ask about a first visit" button and the web address tidewell.example/millbrook, labelled as a concept creative for a fictional practice.',
          de: 'Quadratische Konzeptanzeige: die Überschrift „Physiotherapy, five minutes from Millbrook Market“, eine Illustration der Praxis in ihrer Straße, ein Knopf „Ask about a first visit“ und die Webadresse tidewell.example/millbrook, gekennzeichnet als Konzeptentwurf für eine fiktive Praxis.',
        },
        caption: {
          es: 'Creatividad de concepto cuadrada (1080 por 1080 píxeles). Solo diseño, no es un anuncio publicado.',
          en: 'Square concept creative (1080 by 1080 pixels). Design only, not a published ad.',
          de: 'Quadratischer Konzeptentwurf (1080 mal 1080 Pixel). Nur Design, keine veröffentlichte Anzeige.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, maquetas y textos originales hechos para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo. La consulta, su dirección y su web son ficticias.',
          en: 'Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional.',
          de: 'Originale Vektorillustrationen, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder. Praxis, Adresse und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'clinic-ad-portrait', role: 'creative', folder: 'clinic', file: 'clinic-ad-portrait', widths: [540, 1080], width: 1080, height: 1350, screenshotLang: 'en',
        alt: {
          es: 'Anuncio vertical de concepto: las palabras «Back. Knees. Shoulders. Weekend sport.», una ilustración de una sala de tratamiento, la línea «Physiotherapy for everyday movement, in Millbrook», el botón «Ask about a first visit» y la etiqueta de creatividad de concepto.',
          en: 'Portrait concept ad: the words "Back. Knees. Shoulders. Weekend sport.", an illustration of a treatment studio, the line "Physiotherapy for everyday movement, in Millbrook", the "Ask about a first visit" button and the concept creative label.',
          de: 'Hochformatige Konzeptanzeige: die Worte „Back. Knees. Shoulders. Weekend sport.“, die Illustration eines Behandlungsraums, die Zeile „Physiotherapy for everyday movement, in Millbrook“, der Knopf „Ask about a first visit“ und die Kennzeichnung als Konzeptentwurf.',
        },
        caption: {
          es: 'Creatividad de concepto vertical (1080 por 1350 píxeles). Solo diseño, no es un anuncio publicado.',
          en: 'Portrait concept creative (1080 by 1350 pixels). Design only, not a published ad.',
          de: 'Hochformatiger Konzeptentwurf (1080 mal 1350 Pixel). Nur Design, keine veröffentlichte Anzeige.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, maquetas y textos originales hechos para este concepto con ayuda de IA. Sin fotografías ni imágenes de archivo. La consulta, su dirección y su web son ficticias.',
          en: 'Original vector illustrations, layouts and copy made for this concept with AI assistance. No photographs and no stock images. The practice, its address and its web address are fictional.',
          de: 'Originale Vektorillustrationen, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Keine Fotos und keine Archivbilder. Praxis, Adresse und Webadresse sind fiktiv.',
        },
      },
    ],
  },
  {
    id: 'sample-shop', sample: true, services: ['video', 'ads'], art: 'video', tone: 'coral', related: 'sample-hotel',
    cardTitle: { es: 'Brindle Pantry', en: 'Brindle Pantry', de: 'Brindle Pantry' },
    title: { es: 'Campaña en movimiento para una despensa artesanal', en: 'Artisan pantry motion campaign', de: 'Bewegtbild-Kampagne für einen Fein­kost­laden' },
    kind: { es: 'Comercio', en: 'Retail', de: 'Einzelhandel' },
    badge: { es: 'Campaña de despensa ficticia', en: 'Fictional pantry campaign', de: 'Kampagne für einen fiktiven Feinkostladen' },
    concept: true,
    status: {
      es: 'Trabajo por iniciativa propia para una tienda ficticia: aquí se produjeron ilustraciones de producto, una pieza de movimiento de 10 segundos sin sonido y una creatividad cuadrada. No hubo lanzamiento con un cliente real y no hay datos de cliente ni de rendimiento.',
      en: 'Self-initiated work for a fictional shop: product illustrations, a 10-second silent motion piece and a square creative were produced here. There was no real client launch, and there is no client or performance data.',
      de: 'Eigeninitiative für einen fiktiven Laden: Hier entstanden Produktillustrationen, ein zehnsekündiges Bewegtbild ohne Ton und ein quadratischer Entwurf. Es gab keinen echten Kundenstart, und es gibt keine Kunden- oder Leistungsdaten.',
    },
    context: {
      es: 'Encargo imaginado: una pequeña despensa que vende mermeladas, sales, aceites y galletas saladas quiere que la gente vea qué hay en sus estantes y sepa cuándo está abierta.',
      en: 'An imagined brief: a small pantry shop selling jams, salts, oils and crackers wants people to see what is on its shelves and to know when the shop is open.',
      de: 'Ein erdachter Auftrag: Ein kleiner Feinkostladen mit Marmeladen, Salzen, Ölen und Crackern möchte, dass Menschen sehen, was in den Regalen steht, und wissen, wann der Laden geöffnet hat.',
    },
    challenge: {
      es: 'Mostrar primero los productos como formas sencillas, luego como envases, y después invitar a entrar en la tienda: breve, sin sonido y legible con el sonido apagado, con una imagen cuadrada para los feeds.',
      en: 'Show the products as simple shapes first, then as packaging, then invite people into the shop: short, silent and readable with the sound off, with a square still for feeds.',
      de: 'Die Produkte zuerst als einfache Formen zeigen, dann als Verpackung und danach zum Besuch des Ladens einladen: kurz, ohne Ton und auch bei ausgeschaltetem Ton lesbar, dazu ein quadratisches Bild für Feeds.',
    },
    connected: {
      es: 'Producido aquí: un conjunto de ilustraciones originales de productos y envases, una pieza vertical de movimiento de 10 segundos sin sonido (ilustración y diseño de movimiento, no material filmado) y una creatividad cuadrada. Solo propuestos, no producidos: filmar la tienda y los productos reales, publicar las piezas y poner en marcha la campaña.',
      en: 'Produced here: a set of original product and packaging illustrations, a 10-second silent vertical motion piece (illustration and motion design, not filmed footage) and a square campaign creative. Proposed only, not produced: filming the real shop and products, publishing the pieces and running the campaign.',
      de: 'Hier erstellt: ein Satz originaler Produkt- und Verpackungsillustrationen, ein zehnsekündiges vertikales Bewegtbild ohne Ton (Illustration und Motion Design, kein gefilmtes Material) und ein quadratischer Kampagnenentwurf. Nur vorgeschlagen, nicht erstellt: den echten Laden und die Produkte filmen, die Beiträge veröffentlichen und die Kampagne schalten.',
    },
    outputsTitle: { es: 'Piezas de la campaña', en: 'Campaign outputs', de: 'Bausteine der Kampagne' },
    screens: {
      es: 'Cinco productos ficticios dibujados como envases y una pieza vertical de movimiento que va de los ingredientes al estante y a un escaparate.',
      en: 'Five fictional products drawn as packaging, and a vertical motion piece that moves from ingredients to a shelf to a shop window.',
      de: 'Fünf fiktive Produkte als Verpackungen gezeichnet und ein vertikales Bewegtbild, das von den Zutaten über das Regal zum Schaufenster führt.',
    },
    planTitle: { es: 'Grabación, publicación y campaña propuestas', en: 'Proposed recording, publishing and campaign activity', de: 'Vorgeschlagene Aufnahmen, Veröffentlichung und Kampagne' },
    planNote: {
      es: 'Solo trabajo propuesto. No se filmó, publicó ni puso en marcha nada, y no se usó ninguna cuenta.',
      en: 'Proposed work only. Nothing was filmed, published or run, and no account was used.',
      de: 'Nur vorgeschlagene Arbeit. Es wurde nichts gefilmt, veröffentlicht oder geschaltet, und es wurde kein Konto verwendet.',
    },
    plan: {
      es: [
        'Grabación: filmar los estantes, los envases y la tienda reales en clips cortos que sigan la historia ilustrada, y confirmar antes qué se puede decir de cada producto.',
        'Textos: revisar con la tienda cada descripción de producto y cada línea de texto, sin afirmaciones que no se puedan respaldar.',
        'Publicación: acordar dónde aparecerían la pieza vertical y la creatividad cuadrada y con qué frecuencia, manteniendo igual el nombre y el horario de la tienda en todas partes.',
        'Campaña: decidir público, presupuesto y calendario, y qué se mediría, con consentimiento y sin datos personales en los informes.',
      ],
      en: [
        'Recording: film the real shelves, packaging and shop in short clips that follow the illustrated story, after confirming what may be said about each product.',
        'Words: check every product description and line of copy with the shop, with no claims that cannot be supported.',
        'Publishing: agree where the vertical piece and the square creative would appear and how often, with the shop name and opening hours kept the same everywhere.',
        'Campaign: decide the audience, budget and timing, and what would be measured, with consent and without personal data in reporting.',
      ],
      de: [
        'Aufnahmen: die echten Regale, Verpackungen und den Laden in kurzen Clips filmen, die der illustrierten Geschichte folgen, nachdem geklärt ist, was über jedes Produkt gesagt werden darf.',
        'Texte: jede Produktbeschreibung und jede Textzeile mit dem Laden prüfen, ohne Aussagen, die sich nicht belegen lassen.',
        'Veröffentlichung: festlegen, wo das vertikale Bewegtbild und der quadratische Entwurf erscheinen würden und wie oft, mit überall gleichem Namen und gleichen Öffnungszeiten.',
        'Kampagne: Zielgruppe, Budget und Zeitplan sowie die Messung festlegen, mit Einwilligung und ohne personenbezogene Daten in Berichten.',
      ],
    },
    videos: [
      {
        id: 'shop-motion', folder: 'shop', file: 'brindle-pantry-concept-1080x1920', width: 1080, height: 1920, seconds: 10, fps: 30,
        formats: [{ ext: 'webm', type: 'video/webm; codecs="vp9"', bytes: 759420 }, { ext: 'mp4', type: 'video/mp4; codecs="avc1.640028"', bytes: 892664 }],
        poster: { file: 'shop-poster', width: 720, height: 1280 },
        label: {
          es: 'Pieza de movimiento vertical sin sonido de 10 segundos: ciruelas, limones, tomillo, semillas, guindilla y sal caen sobre un fondo naranja bajo las palabras «Small batches.»; vuelan hacia cinco tarros, latas, una botella y una caja en un estante con las palabras «Jams, salts, oils and crackers.»; el estante se reduce hasta un escaparate bajo un toldo y un cartel «Brindle Pantry», con la invitación «Come and fill a basket», el horario y la dirección web.',
          en: 'Silent vertical motion piece, 10 seconds: plums, lemons, thyme, seeds, chilli and salt drop onto an orange background under the words "Small batches."; they fly into five jars, tins, a bottle and a box on a shelf with the words "Jams, salts, oils and crackers."; the shelf shrinks into a shop window under an awning and a sign reading "Brindle Pantry", with the invitation "Come and fill a basket", the opening hours and the web address.',
          de: 'Stummes vertikales Bewegtbild, 10 Sekunden: Pflaumen, Zitronen, Thymian, Samen, Chili und Salz fallen unter den Worten „Small batches.“ auf einen orangefarbenen Hintergrund; sie fliegen in fünf Gläser, Dosen, eine Flasche und eine Schachtel auf einem Regal mit den Worten „Jams, salts, oils and crackers.“; das Regal schrumpft zu einem Schaufenster unter einer Markise und einem Schild „Brindle Pantry“, mit der Einladung „Come and fill a basket“, den Öffnungszeiten und der Webadresse.',
        },
        caption: {
          es: 'Pieza de movimiento de concepto, 10 segundos, sin sonido, 1080 por 1920 píxeles.',
          en: 'Concept motion piece, 10 seconds, silent, 1080 by 1920 pixels.',
          de: 'Konzept-Bewegtbild, 10 Sekunden, ohne Ton, 1080 mal 1920 Pixel.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, animación, maquetas y textos originales hechos para este concepto con ayuda de IA. No es material filmado ni fotografías. La tienda, sus productos, su horario y su web son ficticios.',
          en: 'Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional.',
          de: 'Originale Vektorillustrationen, Animation, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Kein gefilmtes Material und keine Fotos. Laden, Produkte, Öffnungszeiten und Webadresse sind fiktiv.',
        },
      },
    ],
    images: [
      {
        id: 'shop-card-wide', role: 'card', folder: 'shop', file: 'shop-card-wide', widths: [640, 960, 1280], width: 1280, height: 800, screenshotLang: 'en',
        alt: {
          es: 'Tarjeta de campaña ilustrada: el titular «Small batches.» junto a un estante con cinco productos ficticios, un tarro de ciruela y tomillo, una lata de sal, una botella de aceite de limón, una caja de galletas y un tarro de miel con guindilla.',
          en: 'Illustrated campaign card: the headline "Small batches." beside a shelf of five fictional products, a plum and thyme jam jar, a salt tin, a lemon oil bottle, a cracker box and a chilli honey jar.',
          de: 'Illustrierte Kampagnenkarte: die Überschrift „Small batches.“ neben einem Regal mit fünf fiktiven Produkten, einem Pflaumen-Thymian-Glas, einer Salzdose, einer Zitronenölflasche, einer Cracker-Schachtel und einem Chili-Honig-Glas.',
        },
        caption: {
          es: 'Tarjeta de campaña: el estante ilustrado de cinco productos ficticios.',
          en: 'Campaign card: the illustrated shelf of five fictional products.',
          de: 'Kampagnenkarte: das illustrierte Regal mit fünf fiktiven Produkten.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, animación, maquetas y textos originales hechos para este concepto con ayuda de IA. No es material filmado ni fotografías. La tienda, sus productos, su horario y su web son ficticios.',
          en: 'Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional.',
          de: 'Originale Vektorillustrationen, Animation, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Kein gefilmtes Material und keine Fotos. Laden, Produkte, Öffnungszeiten und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'shop-card-tall', role: 'card-tall', media: '(min-width: 80em)', folder: 'shop', file: 'shop-poster', widths: [360, 720], width: 720, height: 1280, screenshotLang: 'en',
        alt: {
          es: 'Fotograma de la pieza de movimiento vertical: los cinco productos ficticios en un estante sobre fondo amarillo bajo las palabras «Jams, salts, oils and crackers.».',
          en: 'Still from the vertical motion piece: the five fictional products on a shelf on a yellow background under the words "Jams, salts, oils and crackers."',
          de: 'Standbild aus dem vertikalen Bewegtbild: die fünf fiktiven Produkte auf einem Regal vor gelbem Hintergrund unter den Worten „Jams, salts, oils and crackers.“',
        },
        caption: {
          es: 'Fotograma de la pieza de movimiento vertical.',
          en: 'Still from the vertical motion piece.',
          de: 'Standbild aus dem vertikalen Bewegtbild.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, animación, maquetas y textos originales hechos para este concepto con ayuda de IA. No es material filmado ni fotografías. La tienda, sus productos, su horario y su web son ficticios.',
          en: 'Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional.',
          de: 'Originale Vektorillustrationen, Animation, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Kein gefilmtes Material und keine Fotos. Laden, Produkte, Öffnungszeiten und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'shop-sheet', role: 'screen', folder: 'shop', file: 'shop-sheet', widths: [640, 960, 1280], width: 1280, height: 800, screenshotLang: 'en',
        alt: {
          es: 'Hoja de ilustraciones de envases: cinco productos ficticios, mermelada de ciruela y tomillo, sal marina ahumada, aceite de limón, galletas de semillas y miel con guindilla, cada uno sobre un color liso, y debajo seis formas de ingredientes.',
          en: 'Packaging illustration sheet: five fictional products, plum and thyme jam, smoked sea salt, lemon oil, seed crackers and chilli honey, each on a flat colour, with six ingredient shapes below.',
          de: 'Illustrationsbogen mit Verpackungen: fünf fiktive Produkte, Pflaumen-Thymian-Marmelade, Räuchersalz, Zitronenöl, Samen-Cracker und Chili-Honig, jeweils auf einer Farbfläche, darunter sechs Zutatenformen.',
        },
        caption: {
          es: 'Ilustraciones de envases e ingredientes (no son fotografías).',
          en: 'Packaging and ingredient illustrations (not photographs).',
          de: 'Verpackungs- und Zutatenillustrationen (keine Fotos).',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, animación, maquetas y textos originales hechos para este concepto con ayuda de IA. No es material filmado ni fotografías. La tienda, sus productos, su horario y su web son ficticios.',
          en: 'Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional.',
          de: 'Originale Vektorillustrationen, Animation, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Kein gefilmtes Material und keine Fotos. Laden, Produkte, Öffnungszeiten und Webadresse sind fiktiv.',
        },
      },
      {
        id: 'shop-ad-square', role: 'creative', folder: 'shop', file: 'shop-ad-square', widths: [540, 1080], width: 1080, height: 1080, screenshotLang: 'en',
        alt: {
          es: 'Creatividad cuadrada de campaña: las palabras «Fill a basket.», una rodaja de limón, una ciruela y una guindilla sobre un círculo rojo, un estante con cinco productos y una franja inferior con el horario «Tuesday to Saturday, 9 to 5» y la web brindle.example, marcada como creatividad de concepto de una tienda ficticia.',
          en: 'Square campaign creative: the words "Fill a basket.", a lemon slice, a plum and a chilli on a red circle, a shelf with five products and a bottom bar with the hours "Tuesday to Saturday, 9 to 5" and the web address brindle.example, labelled as a concept creative for a fictional shop.',
          de: 'Quadratischer Kampagnenentwurf: die Worte „Fill a basket.“, eine Zitronenscheibe, eine Pflaume und eine Chili auf einem roten Kreis, ein Regal mit fünf Produkten und eine untere Leiste mit den Öffnungszeiten „Tuesday to Saturday, 9 to 5“ und der Webadresse brindle.example, gekennzeichnet als Konzeptentwurf für einen fiktiven Laden.',
        },
        caption: {
          es: 'Creatividad de concepto cuadrada (1080 por 1080 píxeles). Solo diseño, no es un anuncio publicado.',
          en: 'Square concept creative (1080 by 1080 pixels). Design only, not a published ad.',
          de: 'Quadratischer Konzeptentwurf (1080 mal 1080 Pixel). Nur Design, keine veröffentlichte Anzeige.',
        },
        provenance: {
          es: 'Ilustraciones vectoriales, animación, maquetas y textos originales hechos para este concepto con ayuda de IA. No es material filmado ni fotografías. La tienda, sus productos, su horario y su web son ficticios.',
          en: 'Original vector illustrations, animation, layouts and copy made for this concept with AI assistance. Not filmed footage and not photographs. The shop, its products, hours and web address are fictional.',
          de: 'Originale Vektorillustrationen, Animation, Layouts und Texte für dieses Konzept, mit KI-Unterstützung erstellt. Kein gefilmtes Material und keine Fotos. Laden, Produkte, Öffnungszeiten und Webadresse sind fiktiv.',
        },
      },
    ],
  },
];

export const projectById = (id: string) => projects.find((p) => p.id === id);
