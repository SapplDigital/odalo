/**
 * Site-wide facts. Everything marked `null` is intentionally unset: the design
 * handoff lists contact details and the enquiry destination as outstanding inputs,
 * so the UI shows an honest "to be confirmed" state instead of invented data.
 */
export const site = {
  name: 'Odalo',
  /** Verified contact details. Fill these in and the footer / CTA / audit page pick them up. */
  contact: {
    email: null as string | null,
    phone: null as string | null,
    address: null as string | null,
  },
  /**
   * Audit-form delivery. When PUBLIC_AUDIT_ENDPOINT is unset the form runs in
   * simulated mode and never claims anything was sent. See src/lib/submit.ts.
   */
  auditEndpoint: (import.meta.env.PUBLIC_AUDIT_ENDPOINT as string | undefined) || null,
  /** Analytics is not wired in the demo; see src/lib/analytics.ts. */
  analyticsEnabled: false,
};
