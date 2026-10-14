/** FAQs. Answers must match the confirmed offer; revise here, not in layout. DRAFT translations. */
import type { L } from '../i18n';

export interface Faq { id: string; q: L; a: L }

export const faqs: Faq[] = [
  { id: 'one-service',
    q: { es: '¿Puedo contratar un solo servicio?', en: 'Can I hire one service?', de: 'Kann ich nur eine Leistung buchen?' },
    a: { es: 'Sí. Los planes se construyen unos sobre otros, así que puedes empezar con una parte y añadir otras después. Lo definimos contigo en la propuesta.',
         en: 'Yes. The plans build on each other, so you can start with one part and add others later. We define it with you in the proposal.',
         de: 'Ja. Die Pakete bauen aufeinander auf, du kannst also mit einem Teil starten und später weitere ergänzen. Wir legen das gemeinsam im Angebot fest.' } },
  { id: 'plan-includes',
    q: { es: '¿Qué incluye cada plan?', en: 'What is included in each plan?', de: 'Was ist in jedem Paket enthalten?' },
    a: { es: 'La lista completa está en la página de planes, con una comparación y lo que no se incluye. Los planes de esta demo son de ejemplo y están por confirmar.',
         en: 'The full list is on the plans page, with a comparison and what is not included. The plans in this demo are examples and still to be confirmed.',
         de: 'Die vollständige Liste steht auf der Paketseite, mit Vergleich und dem, was nicht enthalten ist. Die Pakete in dieser Demo sind Beispiele und noch zu bestätigen.' } },
  { id: 'ad-spend',
    q: { es: '¿Está incluida la inversión en anuncios?', en: 'Is advertising spend included?', de: 'Ist das Werbebudget enthalten?' },
    a: { es: 'No. La inversión en anuncios se paga directamente a Google o Meta. Nuestro precio cubre la gestión.',
         en: 'No. Ad spend is paid directly to Google or Meta. Our price covers the management.',
         de: 'Nein. Das Werbebudget zahlst du direkt an Google oder Meta. Unser Preis deckt die Betreuung ab.' } },
  { id: 'existing-website',
    q: { es: '¿Podéis trabajar con mi web actual?', en: 'Can you work with my existing website?', de: 'Könnt ihr mit meiner bestehenden Website arbeiten?' },
    a: { es: 'Normalmente sí. En la auditoría revisamos tu web actual y te decimos qué conviene mantener y qué mejorar.',
         en: 'Usually, yes. In the audit we review your current website and tell you what to keep and what to improve.',
         de: 'In der Regel ja. In der Analyse prüfen wir deine aktuelle Website und sagen dir, was bleiben kann und was besser werden sollte.' } },
  { id: 'international',
    q: { es: '¿Trabajáis a nivel internacional?', en: 'Do you work internationally?', de: 'Arbeitet ihr international?' },
    a: { es: 'Sí. Trabajamos en remoto con negocios de distintos países y acordamos al empezar los horarios y la forma de comunicarnos.',
         en: 'Yes. We work remotely with businesses in different countries and agree on hours and how we communicate at the start.',
         de: 'Ja. Wir arbeiten remote mit Unternehmen in verschiedenen Ländern und vereinbaren zu Beginn Zeiten und Kommunikationswege.' } },
  { id: 'languages',
    q: { es: '¿Qué idiomas ofrecéis?', en: 'Which languages do you support?', de: 'Welche Sprachen bietet ihr an?' },
    a: { es: 'Trabajamos en español, inglés y alemán. Los entregables multilingües por plan están por definir.',
         en: 'We work in Spanish, English and German. Multilingual deliverables by plan are still to be defined.',
         de: 'Wir arbeiten auf Spanisch, Englisch und Deutsch. Mehrsprachige Lieferungen je Paket sind noch zu definieren.' } },
  { id: 'change-plan',
    q: { es: '¿Puedo cambiar de plan?', en: 'Can I change my plan?', de: 'Kann ich mein Paket wechseln?' },
    a: { es: 'Esperamos que sí, pero las condiciones de cambio y cancelación aún no están definidas. Las confirmaremos en tu propuesta.',
         en: 'We expect so, but change and cancellation conditions are not defined yet. We will confirm them in your proposal.',
         de: 'Wir gehen davon aus, aber die Bedingungen für Wechsel und Kündigung sind noch nicht festgelegt. Wir bestätigen sie in deinem Angebot.' } },
  { id: 'audit-includes',
    q: { es: '¿Qué incluye la auditoría gratis?', en: 'What does the free audit include?', de: 'Was beinhaltet die kostenlose Analyse?' },
    a: { es: 'Revisamos qué ve un cliente cuando te busca y te enviamos un resumen breve, por ejemplo en un vídeo corto. No tiene coste.',
         en: 'We review what a customer sees when they look for you and send a short summary, for example as a short video. It is free.',
         de: 'Wir prüfen, was ein Kunde sieht, wenn er nach dir sucht, und senden dir eine kurze Zusammenfassung, zum Beispiel als kurzes Video. Sie ist kostenlos.' } },
];

export const faqById = (id: string) => faqs.find((f) => f.id === id);
