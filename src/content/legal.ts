/**
 * Legal, privacy and cookie texts (en / de / es). DRAFT: prepared from the facts supplied by the
 * operator and the implementation as found; not certified legal advice. Open points that need the
 * operator's confirmation are listed in docs/legal-open-points.md.
 * German is the reference text for German law; es/en are translations.
 */
import type { Lang } from '../i18n';

export interface Section { h: string; p: string[] }
export interface LegalPage { title: string; lead: string; sections: Section[] }
export interface LegalCopy {
  banner: string;
  card: { h: string; operator: string; brand: string; address: string; email: string; brandLine: string };
  pages: { privacy: LegalPage; cookies: LegalPage; legal: LegalPage };
}

const en: LegalCopy = {
  banner: 'Draft for review. This text has not been certified as legally compliant. Some business and tax details are still being clarified with the authorities and will be added here once confirmed.',
  card: {
    h: 'Provider and controller',
    operator: 'Operator',
    brand: 'Business designation',
    address: 'Address',
    email: 'Email',
    brandLine: 'Odalo is a brand of Sebastian Tim Appl, trading as Sappl Digital Studios.',
  },
  pages: {
    legal: {
      title: 'Legal notice',
      lead: 'Information under § 5 of the German Digital Services Act (DDG).',
      sections: [
        { h: 'Provider', p: [
          'Odalo is a brand of Sebastian Tim Appl, trading as Sappl Digital Studios. The operator is a sole proprietor under German law.',
          'Address and email are shown above.',
        ] },
        { h: 'Registration and tax details', p: [
          'The business is not entered in a commercial register. Business registration and tax matters are still being clarified with the competent authorities. No VAT identification number is shown because none is available at this time; this notice will be updated if one is issued.',
        ] },
        { h: 'This is a demo website', p: [
          'This website is a demonstration. Prices, plans, sample projects and service descriptions are illustrative. They are not an offer and not a binding quotation. The sample projects (Casa Almina, Tidewell, Brindle Pantry) are labelled concepts for fictional businesses, not client work.',
          'The audit form on this website does not send anything.',
        ] },
        { h: 'Contact', p: ['The best way to reach us is by email, using the address shown above.'] },
        { h: 'Liability for links', p: ['This website links only to its own pages. If external links are added, we have no influence on the content of third-party sites and cannot accept responsibility for it.'] },
      ],
    },
    privacy: {
      title: 'Privacy notice',
      lead: 'How personal data is handled on this demo website (GDPR Art. 13).',
      sections: [
        { h: 'Who is responsible', p: [
          'The controller under the GDPR is Sebastian Tim Appl, trading as Sappl Digital Studios, at the address and email shown above.',
          'No data protection officer has been appointed.',
        ] },
        { h: 'Hosting and server logs', p: [
          'This website is hosted by Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, USA. When you open a page, the hosting servers process technical connection data, typically your IP address, the date and time, the requested address, the browser and device information your browser sends and the response status. This is needed to deliver the page and to keep it secure and stable (legal basis: Art. 6(1)(f) GDPR, our interest in a working and secure website).',
          'We do not use the logs ourselves to identify visitors. How long the hosting provider keeps its logs is determined by the provider; we have not yet confirmed that period.',
          'Netlify is a US company. In its privacy policy (version of 10 April 2026) Netlify states that it participates in the EU-U.S. Data Privacy Framework and uses the EU standard contractual clauses for transfers. We have not yet verified our own contract arrangements with Netlify, such as a data processing agreement.',
        ] },
        { h: 'Browser storage and cookies', p: [
          'This website does not set cookies. It stores two small entries in your browser (localStorage): your language, only if you click a language link, and your cookie notice choice. Details are in the cookie notice. Fonts are served from this website; no external font service is called.',
          'We do not use analytics, advertising, social media plug-ins or other third-party scripts.',
        ] },
        { h: 'Audit form', p: [
          'The audit form is in demo mode. Submitting it does not transmit or store anything: your entries stay in your browser window and are gone when you reload the page. If a delivery service is connected later, this notice will be updated before the form sends any data.',
        ] },
        { h: 'Contact by email', p: [
          'If you write to us by email, we process your address, your message and the related correspondence to answer you (Art. 6(1)(b) or (f) GDPR). We keep it as long as needed to handle your request and for any legal retention duties. We have not defined fixed deletion periods yet.',
        ] },
        { h: 'Your rights', p: [
          'You have the right of access, rectification, erasure, restriction of processing, data portability and objection under Articles 15 to 21 GDPR, and the right to withdraw a consent at any time. To exercise them, write to the email address above.',
          'You also have the right to lodge a complaint with a supervisory authority. The authority responsible for us is: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Postfach 10 29 32, 70025 Stuttgart, https://www.baden-wuerttemberg.datenschutz.de.',
        ] },
        { h: 'Not required to provide data', p: ['Visiting this website does not require you to provide personal data beyond the technical data your browser sends. There is no automated decision-making or profiling.'] },
      ],
    },
    cookies: {
      title: 'Cookie notice',
      lead: 'What this website stores in your browser.',
      sections: [
        { h: 'Cookies', p: ['This website does not set any cookies.'] },
        { h: 'Browser storage we use', p: [
          'odalo.lang (localStorage): remembers your language. It is written only when you click a language link, and it is used to open the site in that language next time. It stays until you delete it.',
          'odalo.cookies (localStorage): remembers that you have seen this notice, so it is not shown again. It stays until you delete it.',
          'Both entries are strictly necessary for the function you requested (language choice, notice). Under § 25(2) No. 2 TDDDG they need no consent. Nothing is shared with third parties.',
        ] },
        { h: 'Analytics and marketing', p: ['None is active. If analytics or marketing tools are ever added, they will be off by default and will only run after you consent, and this notice will be updated first.'] },
        { h: 'Change or delete your choice', p: [
          'Use “Cookie preferences” in the footer to show this notice again. To remove the stored entries, clear this website’s data in your browser settings.',
        ] },
      ],
    },
  },
};

const de: LegalCopy = {
  banner: 'Entwurf zur Prüfung. Dieser Text ist nicht als rechtskonform zertifiziert. Einzelne gewerbe- und steuerrechtliche Angaben werden noch mit den Behörden geklärt und hier ergänzt, sobald sie feststehen.',
  card: {
    h: 'Anbieter und Verantwortlicher',
    operator: 'Betreiber',
    brand: 'Geschäftsbezeichnung',
    address: 'Anschrift',
    email: 'E-Mail',
    brandLine: 'Odalo ist eine Marke von Sebastian Tim Appl, handelnd unter „Sappl Digital Studios“.',
  },
  pages: {
    legal: {
      title: 'Impressum',
      lead: 'Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).',
      sections: [
        { h: 'Anbieter', p: [
          'Odalo ist eine Marke von Sebastian Tim Appl, handelnd unter „Sappl Digital Studios“. Der Betreiber ist Einzelunternehmer nach deutschem Recht.',
          'Anschrift und E-Mail stehen oben.',
        ] },
        { h: 'Register- und Steuerangaben', p: [
          'Das Unternehmen ist nicht im Handelsregister eingetragen. Gewerbe- und steuerrechtliche Fragen werden derzeit noch mit den zuständigen Behörden geklärt. Eine Umsatzsteuer-Identifikationsnummer wird nicht angegeben, da derzeit keine vorliegt; dieses Impressum wird ergänzt, falls eine erteilt wird.',
        ] },
        { h: 'Dies ist eine Demo-Website', p: [
          'Diese Website ist eine Demonstration. Preise, Pakete, Beispielprojekte und Leistungsbeschreibungen sind beispielhaft. Sie sind weder ein Angebot noch ein verbindlicher Kostenvoranschlag. Die Beispielprojekte (Casa Almina, Tidewell, Brindle Pantry) sind als Konzepte für fiktive Unternehmen gekennzeichnet, keine Kundenarbeiten.',
          'Das Analyse-Formular auf dieser Website versendet nichts.',
        ] },
        { h: 'Kontakt', p: ['Am besten erreichst du uns per E-Mail unter der oben genannten Adresse.'] },
        { h: 'Haftung für Links', p: ['Diese Website verlinkt nur auf eigene Seiten. Sollten externe Links ergänzt werden, haben wir keinen Einfluss auf fremde Inhalte und übernehmen dafür keine Verantwortung.'] },
      ],
    },
    privacy: {
      title: 'Datenschutzhinweise',
      lead: 'Wie auf dieser Demo-Website mit personenbezogenen Daten umgegangen wird (Art. 13 DSGVO).',
      sections: [
        { h: 'Verantwortlicher', p: [
          'Verantwortlicher im Sinne der DSGVO ist Sebastian Tim Appl, handelnd unter „Sappl Digital Studios“, unter der oben genannten Anschrift und E-Mail-Adresse.',
          'Ein Datenschutzbeauftragter ist nicht benannt.',
        ] },
        { h: 'Hosting und Server-Logfiles', p: [
          'Diese Website wird von Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, USA, gehostet. Beim Aufruf einer Seite verarbeiten die Hosting-Server technische Verbindungsdaten, in der Regel deine IP-Adresse, Datum und Uhrzeit, die angeforderte Adresse, die von deinem Browser gesendeten Browser- und Geräteinformationen sowie den Antwortstatus. Das ist nötig, um die Seite auszuliefern und sicher und stabil zu betreiben (Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO, unser Interesse an einer funktionierenden und sicheren Website).',
          'Wir nutzen die Logs nicht selbst, um Besucher zu identifizieren. Wie lange der Hosting-Anbieter seine Logs speichert, bestimmt der Anbieter; diese Frist haben wir noch nicht bestätigt.',
          'Netlify ist ein US-Unternehmen. In seiner Datenschutzerklärung (Stand 10. April 2026) gibt Netlify an, am EU-U.S. Data Privacy Framework teilzunehmen und für Übermittlungen die EU-Standardvertragsklauseln einzusetzen. Unsere eigenen vertraglichen Regelungen mit Netlify, etwa einen Auftragsverarbeitungsvertrag, haben wir noch nicht abschließend geprüft.',
        ] },
        { h: 'Browser-Speicher und Cookies', p: [
          'Diese Website setzt keine Cookies. Sie legt zwei kleine Einträge in deinem Browser ab (localStorage): deine Sprache, nur wenn du einen Sprachlink anklickst, und deine Auswahl zum Cookie-Hinweis. Einzelheiten stehen im Cookie-Hinweis. Schriftarten werden von dieser Website ausgeliefert; es wird kein externer Schriftdienst aufgerufen.',
          'Wir setzen keine Analyse- oder Werbewerkzeuge, keine Social-Media-Plug-ins und keine sonstigen Skripte Dritter ein.',
        ] },
        { h: 'Analyse-Formular', p: [
          'Das Analyse-Formular läuft im Demo-Modus. Beim Absenden wird nichts übertragen oder gespeichert: Deine Eingaben bleiben im Browserfenster und sind nach dem Neuladen der Seite weg. Wird später ein Versanddienst angebunden, wird dieser Hinweis aktualisiert, bevor das Formular Daten sendet.',
        ] },
        { h: 'Kontakt per E-Mail', p: [
          'Wenn du uns per E-Mail schreibst, verarbeiten wir deine Adresse, deine Nachricht und den zugehörigen Schriftverkehr, um dir zu antworten (Art. 6 Abs. 1 lit. b oder f DSGVO). Wir speichern sie, solange es zur Bearbeitung deiner Anfrage nötig ist und gesetzliche Aufbewahrungspflichten bestehen. Feste Löschfristen haben wir noch nicht festgelegt.',
        ] },
        { h: 'Deine Rechte', p: [
          'Du hast nach den Artikeln 15 bis 21 DSGVO das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine Einwilligung jederzeit zu widerrufen. Schreibe dazu an die oben genannte E-Mail-Adresse.',
          'Außerdem kannst du dich bei einer Aufsichtsbehörde beschweren. Für uns zuständig ist: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Postfach 10 29 32, 70025 Stuttgart, https://www.baden-wuerttemberg.datenschutz.de.',
        ] },
        { h: 'Keine Pflicht zur Bereitstellung', p: ['Für den Besuch dieser Website musst du über die technischen Daten deines Browsers hinaus keine personenbezogenen Daten angeben. Es gibt keine automatisierte Entscheidungsfindung und kein Profiling.'] },
      ],
    },
    cookies: {
      title: 'Cookie-Hinweis',
      lead: 'Was diese Website in deinem Browser speichert.',
      sections: [
        { h: 'Cookies', p: ['Diese Website setzt keine Cookies.'] },
        { h: 'Von uns genutzter Browser-Speicher', p: [
          'odalo.lang (localStorage): merkt sich deine Sprache. Der Eintrag wird nur geschrieben, wenn du einen Sprachlink anklickst, und dient dazu, die Seite beim nächsten Mal in dieser Sprache zu öffnen. Er bleibt, bis du ihn löschst.',
          'odalo.cookies (localStorage): merkt sich, dass du diesen Hinweis gesehen hast, damit er nicht erneut erscheint. Er bleibt, bis du ihn löschst.',
          'Beide Einträge sind für die von dir gewünschte Funktion (Sprachwahl, Hinweis) unbedingt erforderlich. Nach § 25 Abs. 2 Nr. 2 TDDDG ist dafür keine Einwilligung nötig. Es werden keine Daten an Dritte weitergegeben.',
        ] },
        { h: 'Analyse und Marketing', p: ['Es ist nichts davon aktiv. Sollten jemals Analyse- oder Marketing-Werkzeuge ergänzt werden, sind sie standardmäßig aus und laufen erst nach deiner Einwilligung; zuvor wird dieser Hinweis aktualisiert.'] },
        { h: 'Auswahl ändern oder löschen', p: [
          'Über „Cookie-Einstellungen“ in der Fußzeile blendest du diesen Hinweis wieder ein. Um die gespeicherten Einträge zu entfernen, lösche die Daten dieser Website in den Browsereinstellungen.',
        ] },
      ],
    },
  },
};

const es: LegalCopy = {
  banner: 'Borrador para revisión. Este texto no está certificado como conforme a la ley. Algunos datos mercantiles y fiscales aún se están aclarando con las autoridades y se añadirán aquí cuando estén confirmados.',
  card: {
    h: 'Proveedor y responsable',
    operator: 'Titular',
    brand: 'Denominación comercial',
    address: 'Dirección',
    email: 'Correo electrónico',
    brandLine: 'Odalo es una marca de Sebastian Tim Appl, que opera como «Sappl Digital Studios».',
  },
  pages: {
    legal: {
      title: 'Aviso legal',
      lead: 'Información conforme al § 5 de la ley alemana de servicios digitales (DDG).',
      sections: [
        { h: 'Proveedor', p: [
          'Odalo es una marca de Sebastian Tim Appl, que opera como «Sappl Digital Studios». El titular es un empresario individual según el derecho alemán.',
          'La dirección y el correo electrónico figuran arriba.',
        ] },
        { h: 'Datos de registro y fiscales', p: [
          'La actividad no está inscrita en el registro mercantil. El alta de la actividad y las cuestiones fiscales se están aclarando todavía con las autoridades competentes. No se indica número de identificación fiscal de IVA porque actualmente no existe; este aviso se actualizará si se asigna uno.',
        ] },
        { h: 'Este es un sitio de demostración', p: [
          'Este sitio web es una demostración. Los precios, planes, proyectos de ejemplo y descripciones de servicios son ilustrativos. No constituyen una oferta ni un presupuesto vinculante. Los proyectos de ejemplo (Casa Almina, Tidewell, Brindle Pantry) están señalados como conceptos para negocios ficticios, no trabajos para clientes.',
          'El formulario de auditoría de este sitio no envía nada.',
        ] },
        { h: 'Contacto', p: ['La mejor forma de contactarnos es por correo electrónico, en la dirección indicada arriba.'] },
        { h: 'Responsabilidad por enlaces', p: ['Este sitio solo enlaza a sus propias páginas. Si se añaden enlaces externos, no tenemos influencia sobre el contenido de sitios de terceros y no asumimos responsabilidad por ellos.'] },
      ],
    },
    privacy: {
      title: 'Aviso de privacidad',
      lead: 'Cómo se tratan los datos personales en este sitio de demostración (art. 13 RGPD).',
      sections: [
        { h: 'Responsable', p: [
          'El responsable según el RGPD es Sebastian Tim Appl, que opera como «Sappl Digital Studios», en la dirección y el correo electrónico indicados arriba.',
          'No se ha designado un delegado de protección de datos.',
        ] },
        { h: 'Alojamiento y registros del servidor', p: [
          'Este sitio está alojado por Netlify, Inc., 101 2nd Street, San Francisco, CA 94105, EE. UU. Al abrir una página, los servidores de alojamiento tratan datos técnicos de conexión, normalmente tu dirección IP, la fecha y la hora, la dirección solicitada, la información de navegador y dispositivo que envía tu navegador y el estado de la respuesta. Es necesario para entregar la página y mantenerla segura y estable (base jurídica: art. 6.1.f RGPD, nuestro interés en un sitio operativo y seguro).',
          'No usamos los registros para identificar a los visitantes. El proveedor de alojamiento determina cuánto tiempo conserva sus registros; todavía no hemos confirmado ese plazo.',
          'Netlify es una empresa estadounidense. En su política de privacidad (versión del 10 de abril de 2026) Netlify indica que participa en el Marco de Privacidad de Datos UE-EE. UU. y que usa las cláusulas contractuales tipo de la UE para las transferencias. Todavía no hemos verificado nuestros propios acuerdos con Netlify, por ejemplo un contrato de encargado del tratamiento.',
        ] },
        { h: 'Almacenamiento del navegador y cookies', p: [
          'Este sitio no instala cookies. Guarda dos pequeñas entradas en tu navegador (localStorage): tu idioma, solo si haces clic en un enlace de idioma, y tu elección sobre el aviso de cookies. Los detalles están en el aviso de cookies. Las fuentes se sirven desde este sitio; no se llama a ningún servicio de fuentes externo.',
          'No usamos analítica, publicidad, complementos de redes sociales ni otros scripts de terceros.',
        ] },
        { h: 'Formulario de auditoría', p: [
          'El formulario de auditoría está en modo demostración. Al enviarlo no se transmite ni se guarda nada: tus datos permanecen en la ventana del navegador y desaparecen al recargar la página. Si más adelante se conecta un servicio de envío, este aviso se actualizará antes de que el formulario envíe datos.',
        ] },
        { h: 'Contacto por correo electrónico', p: [
          'Si nos escribes por correo electrónico, tratamos tu dirección, tu mensaje y la correspondencia relacionada para responderte (art. 6.1.b o f RGPD). Los conservamos mientras sea necesario para atender tu consulta y por las obligaciones legales de conservación. Todavía no hemos fijado plazos de eliminación.',
        ] },
        { h: 'Tus derechos', p: [
          'Tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y oposición según los artículos 15 a 21 RGPD, y a retirar un consentimiento en cualquier momento. Para ejercerlos, escribe al correo electrónico indicado arriba.',
          'También puedes presentar una reclamación ante una autoridad de control. La competente para nosotros es: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg, Postfach 10 29 32, 70025 Stuttgart, https://www.baden-wuerttemberg.datenschutz.de.',
        ] },
        { h: 'Sin obligación de facilitar datos', p: ['Para visitar este sitio no tienes que facilitar datos personales más allá de los datos técnicos que envía tu navegador. No hay decisiones automatizadas ni elaboración de perfiles.'] },
      ],
    },
    cookies: {
      title: 'Aviso de cookies',
      lead: 'Qué guarda este sitio en tu navegador.',
      sections: [
        { h: 'Cookies', p: ['Este sitio no instala ninguna cookie.'] },
        { h: 'Almacenamiento del navegador que usamos', p: [
          'odalo.lang (localStorage): recuerda tu idioma. Solo se escribe cuando haces clic en un enlace de idioma y sirve para abrir el sitio en ese idioma la próxima vez. Permanece hasta que lo borres.',
          'odalo.cookies (localStorage): recuerda que has visto este aviso para no mostrarlo de nuevo. Permanece hasta que lo borres.',
          'Ambas entradas son estrictamente necesarias para la función que has pedido (elección de idioma, aviso). Según el § 25(2) n.º 2 TDDDG no requieren consentimiento. No se comparte nada con terceros.',
        ] },
        { h: 'Analítica y marketing', p: ['No hay ninguna activa. Si algún día se añaden herramientas de analítica o marketing, estarán desactivadas por defecto, solo funcionarán tras tu consentimiento y este aviso se actualizará antes.'] },
        { h: 'Cambiar o borrar tu elección', p: [
          'Usa «Preferencias de cookies» en el pie de página para ver de nuevo este aviso. Para eliminar las entradas guardadas, borra los datos de este sitio en la configuración de tu navegador.',
        ] },
      ],
    },
  },
};

export const legalCopy: Record<Lang, LegalCopy> = { en, de, es };
