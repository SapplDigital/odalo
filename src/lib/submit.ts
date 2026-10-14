/**
 * Audit-form delivery boundary — the ONLY place that decides what "sent" means.
 *
 *  - No endpoint configured  -> mode "simulated": nothing leaves the browser, and the UI
 *    says so. It never reports delivery.
 *  - PUBLIC_AUDIT_ENDPOINT set -> POST JSON; success is reported only for a 2xx response.
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
