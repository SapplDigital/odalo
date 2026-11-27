/**
 * Site-wide facts. Anything marked `null` is intentionally unset: the UI shows an
 * honest "to be confirmed" state instead of invented data.
 */
export const site = {
  name: 'Odalo',
  /** Legal operator of the Odalo brand (German sole proprietor, no commercial-register entry). */
  operator: {
    name: 'Sebastian Tim Appl',
    tradeName: 'Sappl Digital Services',
    street: 'Bachweg 5',
    postalCode: '88690',
    city: 'Uhldingen-Mühlhofen',
    country: { en: 'Germany', de: 'Deutschland', es: 'Alemania' },
  },
  /** USt-IdNr. Unset: none has been issued. The legal pages hide the line while this is null. */
  vatId: null as string | null,
  /** Kleinunternehmer under § 19 UStG: the Impressum shows the note only while this is true. */
  smallBusiness: true,
  url: 'https://odalo.sappl-digital-services.com',
  /** Verified contact details. Phone is unset: none has been supplied. */
  contact: {
    email: 'info@sappl-digital-services.com' as string | null,
    phone: null as string | null,
    address: 'Bachweg 5, 88690 Uhldingen-Mühlhofen' as string | null,
  },
  /**
   * Audit-form delivery. When PUBLIC_AUDIT_ENDPOINT is unset the form runs in
   * simulated mode and never claims anything was sent. See src/lib/submit.ts.
   */
  auditEndpoint: (import.meta.env.PUBLIC_AUDIT_ENDPOINT as string | undefined) || null,
  /**
   * Explicit delivery mode (never inferred from hostname or from a local 200):
   *   'netlify'   PUBLIC_AUDIT_TRANSPORT=netlify  -> URL-encoded POST to Netlify Forms (form `netlifyForm.name`, registered in the built HTML)
   *   'json'      PUBLIC_AUDIT_ENDPOINT set        -> generic JSON POST (unchanged contract, see src/lib/submit.ts)
   *   'simulated' neither                          -> nothing is sent and the UI says so
   * If both are set, 'netlify' wins and the endpoint is ignored.
   */
  auditTransport: (import.meta.env.PUBLIC_AUDIT_TRANSPORT === 'netlify' ? 'netlify' : import.meta.env.PUBLIC_AUDIT_ENDPOINT ? 'json' : 'simulated') as 'netlify' | 'json' | 'simulated',
  /** True when a real delivery path is configured (the demo wording is shown otherwise). */
  auditLive: import.meta.env.PUBLIC_AUDIT_TRANSPORT === 'netlify' || !!import.meta.env.PUBLIC_AUDIT_ENDPOINT,
  /** Netlify Forms: one shared form name for all languages; the POST goes to the site root (BASE_URL) of the same origin. */
  netlifyForm: { name: 'audit', path: import.meta.env.BASE_URL as string },
  /** Analytics is not wired in the demo; see src/lib/analytics.ts. */
  analyticsEnabled: false,
};
