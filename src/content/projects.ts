/**
 * SAMPLE projects. These are illustrative scenarios, NOT real clients.
 * They carry no results, quotes or client names. Replace with verified work
 * (and set `sample: false`) before launch.
 */
import type { L } from '../i18n';
import type { ServiceId } from './services';

export interface Project {
  id: string;
  sample: boolean;
  services: ServiceId[];
  art: 'browser' | 'pin' | 'video' | 'chart';
  tone: 'ink' | 'sand' | 'coral' | 'slate';
  title: L;
  kind: L;
  context: L;
  challenge: L;
  connected: L;
  related: string;
}

export const projects: Project[] = [
  {
    id: 'sample-hotel', sample: true, services: ['web', 'local', 'video'], art: 'browser', tone: 'ink', related: 'sample-clinic',
    title: { es: 'Relanzamiento de un hotel boutique', en: 'Boutique hotel relaunch', de: 'Relaunch eines Boutique-Hotels' },
    kind: { es: 'Alojamiento', en: 'Hospitality', de: 'Gastgewerbe' },
    context: {
      es: 'Un alojamiento pequeño con una web anticuada y poca presencia cuando los viajeros buscan dónde dormir.',
      en: 'A small hotel with an outdated website and little presence when travellers search for somewhere to stay.',
      de: 'Ein kleines Hotel mit veralteter Website und kaum Präsenz, wenn Reisende nach einer Unterkunft suchen.',
    },
    challenge: {
      es: 'Mostrar la experiencia real del lugar y facilitar la reserva directa en varios idiomas.',
      en: 'Show what the place is really like and make direct booking easy in several languages.',
      de: 'Zeigen, wie der Ort wirklich ist, und die Direktbuchung in mehreren Sprachen erleichtern.',
    },
    connected: {
      es: 'La web explica, la ficha local aparece en las búsquedas y el vídeo enseña el lugar. Cada pieza apunta a la misma reserva.',
      en: 'The website explains, the local profile appears in search and video shows the place. Every piece points to the same booking.',
      de: 'Die Website erklärt, das lokale Profil erscheint in der Suche und das Video zeigt den Ort. Jedes Teil führt zur selben Buchung.',
    },
  },
  {
    id: 'sample-clinic', sample: true, services: ['local', 'ads'], art: 'pin', tone: 'sand', related: 'sample-shop',
    title: { es: 'Consulta de fisioterapia', en: 'Physiotherapy practice', de: 'Physiotherapiepraxis' },
    kind: { es: 'Salud local', en: 'Local health', de: 'Lokale Gesundheit' },
    context: {
      es: 'Una consulta que depende de que los vecinos la encuentren y confíen en ella.',
      en: 'A practice that depends on neighbours finding it and trusting it.',
      de: 'Eine Praxis, die davon abhängt, dass Nachbarn sie finden und ihr vertrauen.',
    },
    challenge: {
      es: 'Ganar visibilidad cerca y atraer nuevas consultas sin depender solo del boca a boca.',
      en: 'Gain visibility nearby and attract new enquiries without relying only on word of mouth.',
      de: 'Vor Ort sichtbarer werden und neue Anfragen gewinnen, ohne nur auf Mundpropaganda zu setzen.',
    },
    connected: {
      es: 'La presencia local atrae búsquedas y los anuncios refuerzan los momentos clave.',
      en: 'Local presence draws searches and ads reinforce the key moments.',
      de: 'Die lokale Präsenz zieht Suchen an und Anzeigen stärken die entscheidenden Momente.',
    },
  },
  {
    id: 'sample-shop', sample: true, services: ['video', 'ads'], art: 'video', tone: 'coral', related: 'sample-hotel',
    title: { es: 'Tienda de alimentación artesanal', en: 'Craft food shop', de: 'Laden für handwerkliche Lebensmittel' },
    kind: { es: 'Comercio', en: 'Retail', de: 'Einzelhandel' },
    context: {
      es: 'Un comercio con productos con historia, pero sin contenido que la cuente.',
      en: 'A shop with products that have a story, but no content telling it.',
      de: 'Ein Laden mit Produkten, die eine Geschichte haben, aber ohne Inhalte, die sie erzählen.',
    },
    challenge: {
      es: 'Contar el origen de los productos y llevar a las personas adecuadas a la tienda.',
      en: 'Tell the story behind the products and bring the right people to the shop.',
      de: 'Die Geschichte hinter den Produkten erzählen und die richtigen Menschen in den Laden bringen.',
    },
    connected: {
      es: 'Los reels cuentan la historia y los anuncios los llevan a quien puede interesarse.',
      en: 'Reels tell the story and ads carry them to people who may care.',
      de: 'Reels erzählen die Geschichte und Anzeigen bringen sie zu Menschen, die sich dafür interessieren.',
    },
  },
];

export const projectById = (id: string) => projects.find((p) => p.id === id);
