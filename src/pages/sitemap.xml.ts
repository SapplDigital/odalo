import type { APIRoute } from 'astro';
import { languages, href } from '../i18n';
import { services } from '../content/services';
import { projects } from '../content/projects';

// Published, indexable localized routes only (legal placeholders are noindex and excluded).
const paths = ['', 'plans/', 'work/', 'about/', 'audit/', ...services.map((s) => `services/${s.id}/`), ...projects.map((p) => `work/${p.id}/`)];

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? '';
  const urls = paths.flatMap((p) =>
    languages.map((l) => {
      const alts = languages.map((a) => `<xhtml:link rel="alternate" hreflang="${a}" href="${origin}${href(a, p)}"/>`).join('');
      return `<url><loc>${origin}${href(l, p)}</loc>${alts}<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${href('en', p)}"/></url>`;
    }),
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
