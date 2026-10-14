/**
 * Analytics boundary. Nothing is sent in the demo (site.analyticsEnabled = false).
 * When a provider is chosen: set analyticsEnabled, call its SDK inside `send`, and keep
 * it gated behind consent. NEVER pass names, emails, phones or free-text form content.
 * Event names from the handoff: audit_cta, service_explore, service_visit, plan_select,
 * form_start, form_submit_confirmed, form_submit_failed. Dimensions: lang, service, plan, location.
 */
import { site } from '../config/site';

export type TrackEvent =
  | 'audit_cta' | 'service_explore' | 'service_visit' | 'plan_select'
  | 'form_start' | 'form_submit_confirmed' | 'form_submit_failed';

export interface TrackProps { lang?: string; service?: string; plan?: string; location?: string }

export function hasAnalyticsConsent(): boolean {
  try { return localStorage.getItem('odalo.cookies') === 'analytics'; } catch { return false; }
}

export function track(event: TrackEvent, props: TrackProps = {}): void {
  if (!site.analyticsEnabled || !hasAnalyticsConsent()) return;
  send(event, props);
}

// Integration point: replace with the chosen provider call.
function send(_event: TrackEvent, _props: TrackProps): void {}
