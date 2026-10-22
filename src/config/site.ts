/**
 * Site-wide facts. Anything marked `null` is intentionally unset: the UI shows an
 * honest "to be confirmed" state instead of invented data.
 */
export const site = {
  name: 'Odalo',
  /** Legal operator of the Odalo brand (German sole proprietor, no commercial-register entry). */
  operator: {
    name: 'Sebastian Tim Appl',
    tradeName: 'Sappl Digital Studios',
    street: 'Bachweg 5',
    postalCode: '88690',
    city: 'Uhldingen-Mühlhofen',
    country: { en: 'Germany', de: 'Deutschland', es: 'Alemania' },
  },
  url: 'https://odalo.sappl-digital.de',
  /** Verified contact details. Phone is unset: none has been supplied. */
  contact: {
    email: 'Sebastian.Appl@sappl-digital.de' as string | null,
    phone: null as string | null,
    address: 'Bachweg 5, 88690 Uhldingen-Mühlhofen' as string | null,
  },
  /**
   * Audit-form delivery. When PUBLIC_AUDIT_ENDPOINT is unset the form runs in
   * simulated mode and never claims anything was sent. See src/lib/submit.ts.
   */
  auditEndpoint: (import.meta.env.PUBLIC_AUDIT_ENDPOINT as string | undefined) || null,
  /** Analytics is not wired in the demo; see src/lib/analytics.ts. */
  analyticsEnabled: false,
};
