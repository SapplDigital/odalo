/**
 * Audit-form delivery boundary — the ONLY place that decides what "sent" means.
 *
 *  - No endpoint configured  -> mode "simulated": nothing leaves the browser, and the UI
 *    says so. It never reports delivery.
 *  - PUBLIC_AUDIT_ENDPOINT set -> POST JSON; success is reported only for a 2xx response.
 *  - Netlify mode (PUBLIC_AUDIT_TRANSPORT=netlify) -> URL-encoded POST of the registered form (see submitNetlify). 'delivered' then means
 *    "accepted for processing by the platform", never "arrived in an inbox".
 *
 * To go live, point PUBLIC_AUDIT_ENDPOINT at a service that emails/stores the request
 * (e.g. a serverless function or a form provider) and have it return 2xx only after
 * it has accepted the message. See HANDOFF.md → "Connecting delivery".
 */
export interface AuditPayload {
  name: string; email: string; business: string; need: string;
  website?: string; country?: string; language?: string; service?: string; plan?: string; phone?: string;
  privacyAccepted: boolean; marketingOptIn: boolean; pageLanguage: string;
}
export type SubmitResult = { status: 'simulated' } | { status: 'delivered' } | { status: 'failed'; reason: string };

export async function submitAudit(payload: AuditPayload, endpoint: string | null, signal?: AbortSignal): Promise<SubmitResult> {
  if (!endpoint) {
    await new Promise((r) => setTimeout(r, 700)); // shows the sending state; transmits nothing
    return { status: 'simulated' };
  }
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    return res.ok ? { status: 'delivered' } : { status: 'failed', reason: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'failed', reason: e instanceof Error ? e.message : 'network' };
  }
}

/** The registered Netlify form fields, in submission order (see AuditForm.astro: every one exists as an input in the static HTML). */
export const NETLIFY_FIELDS = ['name', 'email', 'business', 'need', 'website', 'country', 'language', 'service', 'plan', 'phone', 'privacy', 'marketing', 'pageLanguage'] as const;

/**
 * Netlify Forms body (application/x-www-form-urlencoded). Booleans are explicit text: privacy = "yes" (it is required, so a valid submission
 * always carries "yes"), marketing = "yes" | "no". `bot-field` is the honeypot (empty for people). Netlify's own `form-name` selects the form.
 */
export function encodeNetlify(p: AuditPayload, formName: string, honeypot = ''): URLSearchParams {
  const v: Record<(typeof NETLIFY_FIELDS)[number], string> = {
    name: p.name, email: p.email, business: p.business, need: p.need, website: p.website ?? '', country: p.country ?? '', language: p.language ?? '',
    service: p.service ?? '', plan: p.plan ?? '', phone: p.phone ?? '', privacy: p.privacyAccepted ? 'yes' : 'no', marketing: p.marketingOptIn ? 'yes' : 'no', pageLanguage: p.pageLanguage,
  };
  const body = new URLSearchParams();
  body.set('form-name', formName);
  body.set('bot-field', honeypot);
  for (const k of NETLIFY_FIELDS) body.set(k, v[k]);
  return body;
}

/** POST to Netlify Forms. Only a 2xx counts as accepted; HTTP errors and network failures are failures (entries are kept by the caller). */
export async function submitNetlify(payload: AuditPayload, target: { name: string; path: string }, honeypot = '', signal?: AbortSignal): Promise<SubmitResult> {
  try {
    const res = await fetch(target.path, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: encodeNetlify(payload, target.name, honeypot).toString(), signal });
    return res.ok ? { status: 'delivered' } : { status: 'failed', reason: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'failed', reason: e instanceof Error ? e.message : 'network' };
  }
}
