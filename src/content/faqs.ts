/** FAQs. Answers must match the confirmed offer; revise here, not in layout. DRAFT translations. */
import type { L } from '../i18n';

/** `aConfigured`: the original answer, used only when a delivery endpoint is configured (see Faq.astro). */
export interface Faq { id: string; q: L; a: L; aConfigured?: L }

export const faqs: Faq[] = [
  { id: 'one-service',
    q: { es: '¿Se puede empezar con un solo servicio?', en: 'Can a project start with one service?', de: 'Kann ein Projekt mit einer Leistung beginnen?' },
    a: { es: 'Con la estructura de planes, sí: los planes se construyen unos sobre otros, así que se podría empezar con una parte y añadir otras después. El alcance se propondría y se acordaría antes de empezar.',
         en: 'With the plan structure, yes: the plans build on each other, so a project could start with one part and add others later. The scope would be proposed and agreed before work starts.',
         de: 'Mit der Paketstruktur ja: Die Pakete bauen aufeinander auf, ein Projekt könnte also mit einem Teil beginnen und später weitere ergänzen. Der Umfang würde vor Beginn der Arbeit vorgeschlagen und vereinbart.' } },
  { id: 'plan-includes',
    q: { es: '¿Qué incluye cada plan?', en: 'What is included in each plan?', de: 'Was ist in jedem Paket enthalten?' },
    a: { es: 'La lista completa está en la página de planes, con una comparación y lo que no se incluye. Algunas condiciones comerciales siguen por confirmar.',
         en: 'The full list is on the plans page, with a comparison and what is not included. Some commercial conditions are still to be confirmed.',
         de: 'Die vollständige Liste steht auf der Paketseite, mit Vergleich und dem, was nicht enthalten ist. Einige kaufmännische Bedingungen sind noch zu bestätigen.' } },
  { id: 'ad-spend',
    q: { es: '¿Está incluida la inversión en anuncios?', en: 'Is advertising spend included?', de: 'Ist das Werbebudget enthalten?' },
    a: { es: 'En los planes, no: la inversión en anuncios se paga directamente a Google o Meta; el plan no incluye ese presupuesto. El plan 360 se presupuesta de forma individual.',
         en: 'In the plans, no: ad spend is paid directly to Google or Meta; the plan does not include that budget. The 360 plan is quoted individually.',
         de: 'In den Paketen nein: Das Werbebudget zahlst du direkt an Google oder Meta; das Paket enthält dieses Budget nicht. Das Paket 360 wird individuell angeboten.' } },
  { id: 'existing-website',
    q: { es: '¿Se puede trabajar con una web existente?', en: 'Can the work start from an existing website?', de: 'Kann die Arbeit bei einer bestehenden Website ansetzen?' },
    a: { es: 'Normalmente sí. Un primer paso propuesto sería revisar tu web actual y anotar qué conviene mantener y qué mejorar.',
         en: 'Usually, yes. A proposed first step would be to review your current website and note what to keep and what to improve.',
         de: 'In der Regel ja. Ein vorgeschlagener erster Schritt wäre, deine aktuelle Website zu prüfen und festzuhalten, was bleiben kann und was besser werden sollte.' } },
  { id: 'concept-work',
    q: { es: '¿Qué son los proyectos de ejemplo?', en: 'What are the example projects?', de: 'Was sind die Beispielprojekte?' },
    a: { es: 'Casa Almina, Tidewell y Brindle Pantry son tres conceptos de iniciativa propia para negocios ficticios. Muestran cómo pueden trabajar juntos la web, la visibilidad local, el contenido y la publicidad. No son trabajo de clientes y no muestran resultados de clientes.',
         en: 'Casa Almina, Tidewell and Brindle Pantry are three self-initiated concepts for fictional businesses. They show how websites, local visibility, content and advertising can work together. They are not client work and show no client results.',
         de: 'Casa Almina, Tidewell und Brindle Pantry sind drei selbst initiierte Konzepte für fiktive Unternehmen. Sie zeigen, wie Website, lokale Sichtbarkeit, Inhalte und Werbung zusammenwirken können. Sie sind keine Kundenarbeit und zeigen keine Kundenergebnisse.' } },
  { id: 'languages',
    q: { es: '¿En qué idiomas está esta web?', en: 'Which languages is this website available in?', de: 'In welchen Sprachen gibt es diese Website?' },
    a: { es: 'Este sitio web está disponible en inglés, español y alemán. Qué idiomas cubriría un proyecto concreto se acuerda antes del presupuesto.',
         en: 'This website is available in English, Spanish and German. Which languages a specific project would cover is agreed before the quote.',
         de: 'Diese Website gibt es auf Englisch, Spanisch und Deutsch. Welche Sprachen ein konkretes Projekt abdecken würde, wird vor dem Angebot abgestimmt.' } },
  { id: 'change-plan',
    q: { es: '¿Se puede cambiar de plan?', en: 'Can a plan be changed?', de: 'Kann ein Paket gewechselt werden?' },
    a: { es: 'Se espera que sí, pero las condiciones de cambio y cancelación aún no están definidas. Se recogerían en una propuesta.',
         en: 'We expect so, but change and cancellation conditions are not defined yet. They would be set out in a proposal.',
         de: 'Wir gehen davon aus, aber die Bedingungen für Wechsel und Kündigung sind noch nicht festgelegt. Sie würden in einem Angebot festgehalten.' } },
  { id: 'audit-includes',
    q: { es: '¿Qué incluye la auditoría gratis?', en: 'What does the free audit include?', de: 'Was beinhaltet die kostenlose Analyse?' },
    a: { es: 'La auditoría gratis es una oferta de Odalo; su alcance detallado, su formato y sus plazos todavía no están confirmados. El formulario de esta demo solo simula un envío: comprueba los campos, muestra una confirmación simulada y mantiene tus datos visibles. Usa datos de ejemplo: no se envía nada.',
         en: 'The free audit is an Odalo offer; its detailed scope, format and response time are not confirmed yet. The form on this demo only simulates a submission: it checks the fields, shows a simulated confirmation and keeps your entries visible. Please use sample details: nothing is sent.',
         de: 'Die kostenlose Analyse ist ein Angebot von Odalo; Umfang, Format und Antwortzeit sind noch nicht bestätigt. Das Formular dieser Demo simuliert nur eine Absendung: Es prüft die Felder, zeigt eine simulierte Bestätigung und lässt deine Eingaben sichtbar. Bitte verwende Beispieldaten: Es wird nichts gesendet.' },
    aConfigured: { es: 'La auditoría gratis es una oferta de Odalo; su alcance detallado, su formato y sus plazos todavía no están confirmados.', en: 'The free audit is an Odalo offer; its detailed scope, format and response time are not confirmed yet.', de: 'Die kostenlose Analyse ist ein Angebot von Odalo; Umfang, Format und Antwortzeit sind noch nicht bestätigt.' } },
];

export const faqById = (id: string) => faqs.find((f) => f.id === id);
